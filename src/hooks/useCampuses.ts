import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Campus {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
}

export const useCampuses = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const { data, error } = await supabase
          .from("campuses")
          .select("*")
          .order("name");

        if (error) throw error;
        setCampuses(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampuses();
  }, []);

  return { campuses, loading, error };
};
