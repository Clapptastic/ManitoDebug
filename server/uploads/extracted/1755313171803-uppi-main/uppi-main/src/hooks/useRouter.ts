
import { useNavigate, useLocation, useParams } from 'react-router-dom';

/**
 * Router hook that provides Next.js-like API for React Router
 */
export const useRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  return {
    query: params,
    pathname: location.pathname,
    asPath: location.pathname + location.search + location.hash,
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1)
  };
};

export default useRouter;
