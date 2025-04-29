import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from './AuthContext';
import { api } from './environments/api';
import { AxiosError } from 'axios';

type Role = 'USER' | 'ADMIN';

interface User {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    role: Role;
}

interface ProfileFormData {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const ProfilePage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdminView, setIsAdminView] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
    const { user: authUser } = useAuth();

    const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<ProfileFormData>();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (authUser?.sub) {
                    const response = await api.get(`/users/${authUser.sub}`);
                    const userData: User = {
                        id: response.data.id,
                        email: response.data.email,
                        firstName: response.data.firstName || null,
                        lastName: response.data.lastName || null,
                        phoneNumber: response.data.phoneNumber || null,
                        role: response.data.role || 'USER'
                    };

                    setCurrentUser(userData);
                    reset({
                        email: userData.email,
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        phoneNumber: userData.phoneNumber || ''
                    });

                    if (userData.role === 'ADMIN') {
                        await fetchUsers();
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setMessage({ text: 'Failed to load profile data', type: 'danger' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [authUser, reset]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage({ text: 'Failed to fetch users', type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: ProfileFormData) => {
        try {
            setIsLoading(true);
            const response = await api.patch(`/users/${authUser?.sub}`, {
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                ...(data.newPassword ? { password: data.newPassword } : {}),
            });

            setMessage({ text: 'Profile updated successfully', type: 'success' });
            setIsEditing(false);
            setCurrentUser(response.data);
            reset({
                email: response.data.email,
                firstName: response.data.firstName,
                lastName: response.data.lastName,
                phoneNumber: response.data.phoneNumber,
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ text: error instanceof AxiosError ? error.response?.data.message : 'An unknown error occurred', type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: Role) => {
        try {
            setIsLoading(true);
            await api.patch(`/users/${userId}`, { role: newRole });

            setMessage({ text: 'User role updated successfully', type: 'success' });
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            setMessage({ text: error instanceof AxiosError ? error.response?.data.message : 'An unknown error occurred', type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 56px)',
                marginTop: '56px'
            }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 56px)',
                marginTop: '56px',
                position: 'relative',
                width: '100%',
                background: 'radial-gradient(at 50% 50%, hsla(220, 30%, 15%, 1), hsla(220, 30%, 5%, 1)',
                backgroundRepeat: 'no-repeat',
                overflowY: 'auto'
            }}>
                <div style={{
                    margin: '20px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem',
                    borderRadius: '12px',
                    background: 'hsla(220, 30%, 10%, 0.9)',
                    width: '90%',
                    maxWidth: '450px',
                    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid hsla(220, 30%, 40%, 0.3)',
                    color: 'white'
                }}>
                    <div style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        marginBottom: '1rem',
                        color: '#FF5252'
                    }}>
                        Failed to load profile data. Please try again later.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 56px)',
            marginTop: '56px',
            position: 'relative',
            width: '100%',
            background: 'radial-gradient(at 50% 50%, hsla(220, 30%, 15%, 1), hsla(220, 30%, 5%, 1)',
            backgroundRepeat: 'no-repeat',
            overflowY: 'auto',
            padding: '20px 0'
        }}>
            <div style={{
                margin: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem',
                borderRadius: '12px',
                background: 'hsla(220, 30%, 10%, 0.9)',
                width: '90%',
                maxWidth: '1200px',
                boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid hsla(220, 30%, 40%, 0.3)',
                color: 'white',
                textAlign: 'center'
            }}>
                <h1 style={{ marginBottom: '1.5rem' }}>Profile</h1>

                {message && (
                    <div style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        marginBottom: '1.5rem',
                        color: message.type === 'success' ? '#4CAF50' : '#FF5252'
                    }}>
                        {message.text}
                    </div>
                )}

                {isAdminView ? (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 10vw, 2.15rem)',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            color: 'white',
                            marginBottom: '1rem'
                        }}>User Management</h2>

                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    marginBottom: '1rem',
                                    color: 'white',
                                    borderCollapse: 'collapse'
                                }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td style={{ padding: '0.75rem' }}>{user.id}</td>
                                                <td style={{ padding: '0.75rem' }}>{user.email}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {user.firstName} {user.lastName}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.375rem 0.75rem',
                                                            fontSize: '1rem',
                                                            backgroundColor: 'black',
                                                            color: 'white',
                                                            border: '1px solid #555',
                                                            borderRadius: '5px'
                                                        }}
                                                        disabled={user.id === currentUser.id}
                                                    >
                                                        <option value="USER">User</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setIsAdminView(false)}
                                style={{
                                    fontFamily: '"Playfair Display", serif',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    padding: '12px',
                                    fontSize: '1.1rem',
                                    border: '1px solid hsla(220, 70%, 20%, 1)',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                                Back to My Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            width: '100%'
                        }}>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 10vw, 2.15rem)',
                                fontWeight: 'bold',
                                color: 'white',
                                marginBottom: '0',
                                textAlign: 'center',
                                width: '100%'
                            }}>Personal Information</h2>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ flex: '1 1 45%' }}>
                                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            {...register('email', { required: 'Email is required' })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: `1px solid ${errors.email ? '#FF5252' : '#555'}`,
                                                borderRadius: '5px',
                                                fontSize: '1rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                            }}
                                            disabled={isLoading}
                                            onFocus={(e) => {
                                                e.target.style.border = '1px solid white';
                                                e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.border = `1px solid ${errors.email ? '#FF5252' : '#555'}`;
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                        {errors.email && (
                                            <div style={{ color: '#FF5252', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                {errors.email.message}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ flex: '1 1 45%' }}>
                                        <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                                        <input
                                            id="phoneNumber"
                                            type="tel"
                                            {...register('phoneNumber')}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #555',
                                                borderRadius: '5px',
                                                fontSize: '1rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                            }}
                                            disabled={isLoading}
                                            onFocus={(e) => {
                                                e.target.style.border = '1px solid white';
                                                e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.border = '1px solid #555';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>

                                    <div style={{ flex: '1 1 45%' }}>
                                        <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem' }}>First Name</label>
                                        <input
                                            id="firstName"
                                            type="text"
                                            {...register('firstName')}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #555',
                                                borderRadius: '5px',
                                                fontSize: '1rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                            }}
                                            disabled={isLoading}
                                            onFocus={(e) => {
                                                e.target.style.border = '1px solid white';
                                                e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.border = '1px solid #555';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>

                                    <div style={{ flex: '1 1 45%' }}>
                                        <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem' }}>Last Name</label>
                                        <input
                                            id="lastName"
                                            type="text"
                                            {...register('lastName')}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #555',
                                                borderRadius: '5px',
                                                fontSize: '1rem',
                                                backgroundColor: 'black',
                                                color: 'white',
                                                transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                            }}
                                            disabled={isLoading}
                                            onFocus={(e) => {
                                                e.target.style.border = '1px solid white';
                                                e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.border = '1px solid #555';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Change Password</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ flex: '1 1 30%' }}>
                                            <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
                                            <input
                                                id="currentPassword"
                                                type="password"
                                                {...register('currentPassword')}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #555',
                                                    borderRadius: '5px',
                                                    fontSize: '1rem',
                                                    backgroundColor: 'black',
                                                    color: 'white',
                                                    transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                                }}
                                                disabled={isLoading}
                                                onFocus={(e) => {
                                                    e.target.style.border = '1px solid white';
                                                    e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.border = '1px solid #555';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                        </div>

                                        <div style={{ flex: '1 1 30%' }}>
                                            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                                            <input
                                                id="newPassword"
                                                type="password"
                                                {...register('newPassword', {
                                                    minLength: {
                                                        value: 8,
                                                        message: 'Password must be at least 8 characters',
                                                    },
                                                    validate: (val) => {
                                                        if (watch('currentPassword') && !val) {
                                                            return 'New password is required when changing password';
                                                        }
                                                        return true;
                                                    },
                                                })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: `1px solid ${errors.newPassword ? '#FF5252' : '#555'}`,
                                                    borderRadius: '5px',
                                                    fontSize: '1rem',
                                                    backgroundColor: 'black',
                                                    color: 'white',
                                                    transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                                }}
                                                disabled={isLoading}
                                                onFocus={(e) => {
                                                    e.target.style.border = '1px solid white';
                                                    e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.border = `1px solid ${errors.newPassword ? '#FF5252' : '#555'}`;
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                            {errors.newPassword && (
                                                <div style={{ color: '#FF5252', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                    {errors.newPassword.message}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: '1 1 30%' }}>
                                            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                {...register('confirmPassword', {
                                                    validate: (val) => {
                                                        if (watch('newPassword') !== val) {
                                                            return 'Passwords do not match';
                                                        }
                                                        return true;
                                                    },
                                                })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: `1px solid ${errors.confirmPassword ? '#FF5252' : '#555'}`,
                                                    borderRadius: '5px',
                                                    fontSize: '1rem',
                                                    backgroundColor: 'black',
                                                    color: 'white',
                                                    transition: 'border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
                                                }}
                                                disabled={isLoading}
                                                onFocus={(e) => {
                                                    e.target.style.border = '1px solid white';
                                                    e.target.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.7)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.border = `1px solid ${errors.confirmPassword ? '#FF5252' : '#555'}`;
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            />
                                            {errors.confirmPassword && (
                                                <div style={{ color: '#FF5252', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                    {errors.confirmPassword.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            reset();
                                        }}
                                        style={{
                                            fontFamily: '"Playfair Display", serif',
                                            backgroundColor: 'transparent',
                                            color: '#d3d3d3',
                                            padding: '12px',
                                            fontSize: '1.1rem',
                                            border: '1px solid hsla(220, 30%, 40%, 0.3)',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            fontWeight: 'bold'
                                        }}
                                        disabled={isLoading}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.textDecoration = 'underline';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.textDecoration = 'none';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            fontFamily: '"Playfair Display", serif',
                                            backgroundColor: 'hsla(220, 70%, 8%, 1)',
                                            color: 'white',
                                            padding: '12px',
                                            fontSize: '1.1rem',
                                            border: '1px solid hsla(220, 70%, 20%, 1)',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            marginTop: '20px'
                                        }}
                                        disabled={isLoading}
                                        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
                                        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '5%', marginBottom:'5%' }}>
                                <div style={{ flex: '1 1 45%' }}>
                                    <p style={{ color: '#d3d3d3', marginBottom: '0.5rem', fontSize: '20px' }}>Email</p>
                                    <p style={{ color: 'white', fontWeight: 'normal' }}>{currentUser?.email || 'Not available'}</p>
                                </div>

                                <div style={{ flex: '1 1 45%' }}>
                                    <p style={{ color: '#d3d3d3', marginBottom: '0.5rem', fontSize: '20px' }}>Phone Number</p>
                                    <p style={{ color: 'white', fontWeight: 'normal' }}>{currentUser?.phoneNumber || 'Not provided'}</p>
                                </div>

                                <div style={{ flex: '1 1 45%' }}>
                                    <p style={{ color: '#d3d3d3', marginBottom: '0.5rem', fontSize: '20px' }}>First Name</p>
                                    <p style={{ color: 'white', fontWeight: 'normal' }}>{currentUser?.firstName || 'Not provided'}</p>
                                </div>

                                <div style={{ flex: '1 1 45%' }}>
                                    <p style={{ color: '#d3d3d3', marginBottom: '0.5rem', fontSize: '20px' }}>Last Name</p>
                                    <p style={{ color: 'white', fontWeight: 'normal' }}>{currentUser?.lastName || 'Not provided'}</p>
                                </div>

                                <div style={{ flex: '1 1 45%' }}>
                                    <p style={{ color: '#d3d3d3', marginBottom: '0.5rem', fontSize: '20px' }}>Role</p>
                                    <p style={{ color: 'white', fontWeight: 'normal' }}>{currentUser?.role?.toLowerCase() || 'Not provided'}</p>
                                </div>
                            </div>
                        )}

                        {currentUser.role === 'ADMIN' && !isEditing && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '1.5rem',
                                gap: '1rem'
                            }}>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    style={{
                                        fontFamily: '"Playfair Display", serif',
                                        backgroundColor: 'hsla(220, 70%, 8%, 1)',
                                        color: 'white',
                                        padding: '12px',
                                        fontSize: '1.1rem',
                                        border: '1px solid hsla(220, 70%, 20%, 1)',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
                                    onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => setIsAdminView(true)}
                                    style={{
                                        fontFamily: '"Playfair Display", serif',
                                        backgroundColor: 'hsla(220, 70%, 8%, 1)',
                                        color: 'white',
                                        padding: '12px',
                                        fontSize: '1.1rem',
                                        border: '1px solid hsla(220, 70%, 20%, 1)',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        flex: 1
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
                                    onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    View All Users
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;