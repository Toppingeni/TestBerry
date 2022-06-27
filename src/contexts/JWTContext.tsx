import React, { createContext, useEffect, useReducer } from 'react';

// third-party
import { Chance } from 'chance';
import jwtDecode from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'store/actions';
import accountReducer from 'store/accountReducer';

// project imports
import Loader from 'ui-component/Loader';
import axios from 'utils/axios';

// types
import { InitialLoginContextProps, JWTContextType, JWTDecodeType } from 'types/auth';
import { UserProfile } from 'types/user-profile';

const chance = new Chance();

// constant
const initialState: InitialLoginContextProps = {
    isLoggedIn: false,
    isInitialized: false,
    user: null
};

export type VerifyTokenResponse = 'Expired' | 'OK' | 'Wrong';
const verifyToken: (st: string | null) => Promise<VerifyTokenResponse> = async (serviceToken) => {
    if (!serviceToken || serviceToken === null) {
        return 'Wrong';
    }
    const decodeToken = jwtDecode<JWTDecodeType>(serviceToken);
    if (decodeToken && decodeToken.exp < Date.now() / 1000) {
        return 'Expired';
    }
    const response = await axios.post(
        '/api/user/verify',
        {},
        {
            headers: {
                Authorization: `Bearer ${serviceToken}`
            }
        }
    );
    /**
     * Property 'exp' does not exist on type '<T = unknown>(token: string, options?: JwtDecodeOptions | undefined) => T'.
     */
    return response.data === 'OK' ? 'OK' : 'Wrong';
};

export const refreshToken = async () => {
    const response = await axios.post(
        '/api/user/refresh-token',
        {},
        {
            headers: {
                'x-refresh-token': localStorage.getItem('refreshToken') || ''
            }
        }
    );
    const { token: serviceToken } = response.data;
    setSession(serviceToken);
};

const setSession = (serviceToken?: string | null) => {
    if (serviceToken) {
        localStorage.setItem('serviceToken', serviceToken);
        axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
    } else {
        localStorage.removeItem('serviceToken');
        delete axios.defaults.headers.common.Authorization;
    }
};

const setRefreshToken = (serviceToken?: string | null) => {
    if (serviceToken) {
        localStorage.setItem('refreshToken', serviceToken);
        axios.defaults.headers.common['x-refresh-token'] = serviceToken;
    } else {
        localStorage.removeItem('refreshToken');
        delete axios.defaults.headers.common['x-refresh-token'];
    }
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //
const JWTContext = createContext<JWTContextType | null>(null);
export const JWTProvider = ({ children }: { children: React.ReactElement }) => {
    const [state, dispatch] = useReducer(accountReducer, initialState);

    useEffect(() => {
        const init = async () => {
            try {
                const serviceToken = window.localStorage.getItem('serviceToken');
                const dispatchContext = (verify: string) => {
                    if (serviceToken && verify === 'OK') {
                        setSession(serviceToken);
                        const user = jwtDecode<UserProfile>(serviceToken);
                        dispatch({
                            type: LOGIN,
                            payload: {
                                isLoggedIn: true,
                                user
                            }
                        });
                    } else {
                        dispatch({
                            type: LOGOUT
                        });
                    }
                };
                let verifyRes = await verifyToken(serviceToken);
                if (verifyRes === 'Expired') {
                    await refreshToken();
                    const newServiceToken = window.localStorage.getItem('serviceToken');
                    verifyRes = await verifyToken(newServiceToken);
                    dispatchContext(verifyRes);
                } else {
                    dispatchContext(verifyRes);
                }
            } catch (err) {
                console.error(err);
                dispatch({
                    type: LOGOUT
                });
            }
        };

        init();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await axios.post('/api/user/login', {
                userId: username,
                password,
                org: '',
                trackingstatus: 'T'
            });
            const { token: serviceToken } = response.data;
            const user = jwtDecode<UserProfile>(serviceToken);
            setSession(serviceToken);
            setRefreshToken(response.headers['x-refresh-token']);
            dispatch({
                type: LOGIN,
                payload: {
                    isLoggedIn: true,
                    user
                }
            });
        } catch (error) {
            throw new Error(error as string);
        }
    };

    const register = async (email: string, password: string, firstName: string, lastName: string) => {
        // todo: this flow need to be recode as it not verified
        const id = chance.bb_pin();
        const response = await axios.post('/api/account/register', {
            id,
            email,
            password,
            firstName,
            lastName
        });
        let users = response.data;

        if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
            const localUsers = window.localStorage.getItem('users');
            users = [
                ...JSON.parse(localUsers!),
                {
                    id,
                    email,
                    password,
                    name: `${firstName} ${lastName}`
                }
            ];
        }

        window.localStorage.setItem('users', JSON.stringify(users));
    };

    const logout = () => {
        setSession(null);
        setRefreshToken(null);
        dispatch({ type: LOGOUT });
    };

    const resetPassword = (email: string) => console.log(email);

    const updateProfile = () => {};

    if (state.isInitialized !== undefined && !state.isInitialized) {
        return <Loader />;
    }

    return (
        <JWTContext.Provider value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext.Provider>
    );
};

export default JWTContext;
