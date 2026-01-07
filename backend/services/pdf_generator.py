import os
import traceback
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.utils import ImageReader

class PDFGenerator:
    async def generate(self, brand_id: str, base_dir: str, title: str, report_text: str, assets: list = None, colors: list = None, css_data: list = None):
        output_path = os.path.join(base_dir, brand_id, "Reports", "Brand_Report.pdf")
        
        try:
            doc = SimpleDocTemplate(output_path, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            story.append(Paragraph(f"Brand Identity Analysis: {title}", styles['Title']))
            story.append(Spacer(1, 20))
            
            # Snapshot Section
            story.append(Paragraph("Visual Identity Snapshot", styles['Heading2']))
            story.append(Spacer(1, 10))
            snap_path = os.path.join(base_dir, brand_id, "Snapshot", "home.png")
            if os.path.exists(snap_path):
                img = Image(snap_path, width=460, height=280)
                story.append(img)
                story.append(Spacer(1, 20))
            
            # Logos and Assets Section
            if assets:
                story.append(Paragraph("Detected Brand Assets", styles['Heading2']))
                story.append(Spacer(1, 10))
                # Add up to 3 logos horizontally if possible, or just a grid
                for asset_path in assets[:5]:
                    try:
                        if os.path.exists(asset_path) and not asset_path.endswith('.svg'):
                            img = Image(asset_path, width=100, height=100, kind='proportional')
                            story.append(img)
                            story.append(Spacer(1, 5))
                    except: continue
                story.append(Spacer(1, 20))

            # Colors Section
            if colors:
                from reportlab.platypus import Table, TableStyle
                from reportlab.lib import colors as rl_colors

                story.append(Paragraph("Brand Color Palette", styles['Heading2']))
                story.append(Spacer(1, 10))
                
                table_data = []
                # Create a 2-column row for each color
                for c_item in colors:
                    if os.path.exists(c_item['path']):
                        swatch_img = Image(c_item['path'], width=30, height=30)
                        hex_label = Paragraph(f"<b>{c_item['hex']}</b>", styles['BodyText'])
                        table_data.append([swatch_img, hex_label])
                
                if table_data:
                    # Column widths: 40 for image, 100 for text
                    t = Table(table_data, colWidths=[40, 100], hAlign='LEFT')
                    t.setStyle(TableStyle([
                        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                    ]))
                    story.append(t)
                
                story.append(Spacer(1, 20))

            # CSS / Styling Section
            if css_data:
                story.append(Paragraph("Design System & CSS Resources", styles['Heading2']))
                story.append(Spacer(1, 10))
                for css in css_data:
                    url = css.get('url', 'Unknown URL')
                    story.append(Paragraph(f"• External Stylesheet: {url}", styles['BodyText']))
                story.append(Spacer(1, 20))
            
            # AI Analysis Report
            story.append(Paragraph("AI Strategic Analysis", styles['Heading2']))
            story.append(Spacer(1, 10))
            
            for line in report_text.split('\n'):
                line = line.strip()
                if not line: continue
                
                style = styles['BodyText']
                if line.startswith('# '): 
                    style = styles['Heading1']
                    line = line[2:]
                elif line.startswith('## '):
                    style = styles['Heading2']
                    line = line[3:]
                elif line.startswith('### '):
                    style = styles['Heading3']
                    line = line[4:]
                elif line.startswith('- '):
                    line = f"• {line[2:]}"
                
                # Basic Markdown sanitization for ReportLab Paragraph
                line = line.replace('**', '')
                line = line.replace('*', '')
                
                try:
                    story.append(Paragraph(line, style))
                    story.append(Spacer(1, 6))
                except:
                    # If Paragraph fails (due to special chars), try a simpler version
                    story.append(Paragraph("Content omitted due to formatting issue.", styles['BodyText']))

            doc.build(story)
            return output_path
        except Exception as e:
            print(f"PDF Gen failed: {traceback.format_exc()}")
            return None
