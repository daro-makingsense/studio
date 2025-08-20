import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SupabaseError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-900 mb-2">
          Database Connection Error
        </h2>
        <p className="text-red-700 mb-4">
          Unable to connect to Supabase. Please ensure:
        </p>
        <ul className="text-left text-sm text-red-600 space-y-2 mb-4">
          <li>• Supabase project is configured</li>
          <li>• Environment variables are set in .env.local</li>
          <li>• Database tables are created</li>
          <li>• Data has been seeded using npm run db:insert-dummy-data</li>
        </ul>
        <div className="bg-red-100 p-3 rounded text-xs text-red-800 font-mono">
          Check console for detailed error messages
        </div>
      </div>
    </div>
  );
};