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

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  isVisible: boolean;
  type?: 'info' | 'success' | 'error';
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, isVisible, type = 'info', onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-16 right-6 z-[999] max-w-sm w-full"
        >
          <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl flex items-center gap-4">
            <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20 text-green-400' : type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
              {type === 'success' ? <CheckCircle className="w-5 h-5" /> : type === 'error' ? <X className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">
                {type === 'success' ? 'Complete' : type === 'error' ? 'Error' : 'Processing'}
              </h4>
              <p className="text-xs text-neutral-400">{message}</p>
            </div>
            {onClose && (
               <button onClick={onClose} className="text-neutral-500 hover:text-white">
                 <X className="w-4 h-4" />
               </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
