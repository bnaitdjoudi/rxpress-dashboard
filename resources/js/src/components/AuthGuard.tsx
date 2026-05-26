import { Navigate } from 'react-router-dom';
import { PropsWithChildren } from 'react';

const AuthGuard = ({ children }: PropsWithChildren) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/auth/boxed-signin" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
