# ACTION: Implementing AI Storyboard Workflow

## Step 1: Logic & State Implementation
I will modify `src/components/LookbookModule.tsx` to:
1.  Define `StoryboardPage`, `PageConfig`, and `CuratorialStrategy` types.
2.  Add state variables for `storyboard`, `viewMode`, and `groupingStrategy`.
3.  Implement the `draftStoryboard` function which calls Gemini Flash to organize the selected products into pages.

## Step 2: UI Implementation
I will add the "Draft Storyboard" button and the "Storyboard View" UI to visualize and edit the generated pages.