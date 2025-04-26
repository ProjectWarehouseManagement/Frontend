import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from './AuthContext';
import { api } from './environments/api';

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
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
    const { user: authUser } = useAuth();

    const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<ProfileFormData>();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (authUser?.sub) {
                    console.log('Fetching user data for ID:', authUser.sub); // Debug log
                    const response = await api.get(`/users/${authUser.sub}`);
                    console.log('User data received:', response.data); // Debug log
                    
                    // Ensure the data matches your User interface
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
            setMessage({ text: error instanceof Error ? error.message : 'An unknown error occurred', type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, newRole: Role) => {
        try {
            setIsLoading(true);
            await api.patch(`/users/${userId}/role`, { role: newRole });

            setMessage({ text: 'User role updated successfully', type: 'success' });
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            setMessage({ text: error instanceof Error ? error.message : 'An unknown error occurred', type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mt-4 d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">
                    Failed to load profile data. Please try again later.
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Profile</h1>

            {message && (
                <div className={`alert alert-${message.type} mb-4`}>
                    {message.text}
                </div>
            )}

            {currentUser.role === 'ADMIN' && (
                <div className="mb-4">
                    <button
                        onClick={() => setIsAdminView(!isAdminView)}
                        className={`btn ${isAdminView ? 'btn-secondary' : 'btn-primary'}`}
                    >
                        {isAdminView ? 'View My Profile' : 'View All Users'}
                    </button>
                </div>
            )}

            {isAdminView ? (
                <div className="card mb-4">
                    <div className="card-body">
                        <h2 className="card-title mb-4">User Management</h2>
                        {isLoading ? (
                            <div className="d-flex justify-content-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th scope="col">ID</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    {user.firstName} {user.lastName}
                                                </td>
                                                <td>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                                                        className="form-select form-select-sm"
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
                    </div>
                </div>
            ) : (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="card-title mb-0">Personal Information</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-primary"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="    row mb-4">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            {...register('email', { required: 'Email is required' })}
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            disabled={isLoading}
                                        />
                                        {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                                        <input
                                            id="phoneNumber"
                                            type="tel"
                                            {...register('phoneNumber')}
                                            className="form-control"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="firstName" className="form-label">First Name</label>
                                        <input
                                            id="firstName"
                                            type="text"
                                            {...register('firstName')}
                                            className="form-control"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="lastName" className="form-label">Last Name</label>
                                        <input
                                            id="lastName"
                                            type="text"
                                            {...register('lastName')}
                                            className="form-control"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="h5 mb-3">Change Password</h3>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label htmlFor="currentPassword" className="form-label">Current Password</label>
                                            <input
                                                id="currentPassword"
                                                type="password"
                                                {...register('currentPassword')}
                                                className="form-control"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label htmlFor="newPassword" className="form-label">New Password</label>
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
                                                className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                                disabled={isLoading}
                                            />
                                            {errors.newPassword && (
                                                <div className="invalid-feedback">{errors.newPassword.message}</div>
                                            )}
                                        </div>

                                        <div className="col-md-4">
                                            <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
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
                                                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                                disabled={isLoading}
                                            />
                                            {errors.confirmPassword && (
                                                <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            reset();
                                        }}
                                        className="btn btn-outline-secondary"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
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
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <h5 className="text-muted">Email</h5>
                                    <p className="text-dark font-weight-normal">{currentUser?.email || 'Not available'}</p>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <h5 className="text-muted">Phone Number</h5>
                                    <p className="text-dark font-weight-normal">{currentUser?.phoneNumber || 'Not provided'}</p>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <h5 className="text-muted">First Name</h5>
                                    <p className="text-dark font-weight-normal">{currentUser?.firstName || 'Not provided'}</p>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <h5 className="text-muted">Last Name</h5>
                                    <p className="text-dark font-weight-normal">{currentUser?.lastName || 'Not provided'}</p>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <h5 className="text-muted">Role</h5>
                                    <p className="text-dark font-weight-normal">{currentUser?.role?.toLowerCase() || 'Not provided'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;