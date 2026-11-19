/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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