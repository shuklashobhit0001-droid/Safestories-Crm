import React, { useEffect, useState } from 'react';
import { BookingPage } from './BookingPage';
import { therapistData } from '../lib/sessionData';
import { Loader } from 'lucide-react';

interface PublicBookingContainerProps {
  slug: string;
}

export const PublicBookingContainer: React.FC<PublicBookingContainerProps> = ({ slug }) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      // Find the session in therapistData
      let foundSession = null;
      let therapistName = "";

      for (const [name, data] of Object.entries(therapistData)) {
        const match = data.services.find(s => s.slug === `/${slug}`);
        if (match) {
          foundSession = { ...match, owner: name };
          therapistName = name;
          break;
        }
      }

      if (!foundSession) {
        setError("Session not found or is no longer available.");
        setLoading(false);
        return;
      }

      // Check if therapist is disabled in database
      try {
        const response = await fetch(`/api/therapist-availability?name=${encodeURIComponent(therapistName)}`);
        const data = await response.json();
        
        if (data.isDisabled) {
          setError("This therapist is currently unavailable for bookings. Please contact support or choose another therapist.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking therapist availability:', err);
        // Continue anyway if API fails
      }

      setSessionData(foundSession);
      setLoading(false);
    };

    checkAvailability();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (loading || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin text-teal-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <BookingPage session={sessionData} isPublic={true} />
    </div>
  );
};
