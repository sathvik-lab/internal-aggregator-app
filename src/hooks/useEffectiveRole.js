import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../constants/constants';
import { getCurrentMemberRole } from '../services/businessMembers';

export const useEffectiveRole = () => {
  const { user, userProfile } = useAuth();
  const [memberRole, setMemberRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRole = async () => {
      if (!user?.uid) {
        if (mounted) {
          setMemberRole(null);
          setLoading(false);
        }
        return;
      }

      const defaultRole = userProfile?.role || USER_ROLES.OWNER;
      if (defaultRole === USER_ROLES.OWNER) {
        if (mounted) {
          setMemberRole(USER_ROLES.OWNER);
          setLoading(false);
        }
        return;
      }

      const result = await getCurrentMemberRole({ userId: user.uid });
      if (mounted) {
        setMemberRole(result.role || defaultRole);
        setLoading(false);
      }
    };

    setLoading(true);
    loadRole();
    return () => {
      mounted = false;
    };
  }, [user?.uid, userProfile?.role]);

  const role = useMemo(
    () => memberRole || userProfile?.role || USER_ROLES.OWNER,
    [memberRole, userProfile?.role]
  );

  return {
    role,
    isOwner: role === USER_ROLES.OWNER,
    isStaff: role === USER_ROLES.STAFF,
    loading,
  };
};

export default useEffectiveRole;
