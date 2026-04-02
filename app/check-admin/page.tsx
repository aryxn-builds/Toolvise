'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CheckAdminPage() {
  const [profile, setProfile] = useState<{ is_admin?: boolean, email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Not logged in. Please sign in first.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError("Error fetching profile: " + error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    check();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
        <h1 className="text-2xl font-black mb-6">Permission Checker</h1>
        
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-2 border-red-500 p-4 rounded-lg mb-6">
            <p className="text-red-700 font-bold">{error}</p>
            <Link href="/login" className="text-sm underline block mt-2 text-red-600">Go to Login</Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-black">
              <p className="text-sm text-gray-500">Logged in email:</p>
              <p className="font-bold">{profile?.email || "No email in profile"}</p>
            </div>

            <div className={`p-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center ${profile?.is_admin ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="text-sm uppercase font-black mb-1">Admin Status</p>
              <p className={`text-4xl font-black ${profile?.is_admin ? 'text-green-700' : 'text-red-700'}`}>
                {profile?.is_admin ? 'VERIFIED ✅' : 'DENIED ❌'}
              </p>
            </div>

            {profile?.is_admin ? (
              <Link 
                href="/admin" 
                className="block w-full bg-amber-1000 text-white text-center py-4 rounded-xl font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                GOTO ADMIN DASHBOARD
              </Link>
            ) : (
              <p className="text-sm text-gray-600 italic">
                If this says &quot;DENIED&quot;, your SQL command didn&apos;t update this specific user. Check your email spelling in the SQL!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
