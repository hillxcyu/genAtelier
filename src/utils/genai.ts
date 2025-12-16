// Client-side proxy for Backend AI Service
// This replaces the direct SDK usage to keep secrets on the server.

const API_BASE_URL = '/api'; // Relative path, will be proxied by Vite in dev

class ModelProxy {
  async generateContent(params: { model: string, contents: any, config?: any }) {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }
}

class AIProxy {
  models: ModelProxy;

  constructor() {
    this.models = new ModelProxy();
  }
}

// Export a singleton instance to match the existing API usage
export const ai = new AIProxy();