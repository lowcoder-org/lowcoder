import { useState, useEffect } from 'react';
import { getManagedApps } from '../../services/enterprise.service';

export const useManagedApps = (environmentId: string) => {
  const [managedApps, setManagedApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagedApps = async () => {
      setLoading(true);
      try {
        const apps = await getManagedApps(environmentId);
        setManagedApps(apps);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch managed apps');
      } finally {
        setLoading(false);
      }
    };

    fetchManagedApps();
  }, [environmentId]);

  return { managedApps, loading, error };
};
