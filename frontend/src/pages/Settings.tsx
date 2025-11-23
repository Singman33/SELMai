import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { userAPI } from '../services/api';

const Settings: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { addError } = useError();
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [profileData, setProfileData] = useState({
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Mettre à jour profileData quand user change
    useEffect(() => {
        if (user) {
            setProfileData({
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!profileData.email || !profileData.firstName || !profileData.lastName) {
            addError('Tous les champs sont obligatoires', 'error');
            return;
        }

        // Validation email basique
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
            addError('Email invalide', 'error');
            return;
        }

        try {
            setIsSavingProfile(true);
            await userAPI.updateProfile(profileData.email, profileData.firstName, profileData.lastName);
            addError('Profil mis à jour avec succès !', 'success');
            setIsEditingProfile(false);

            // Rafraîchir les données utilisateur
            await refreshUser();
        } catch (error: any) {
            addError(
                error.userMessage || 'Erreur lors de la mise à jour du profil',
                'error',
                error.userDetails
            );
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCancelProfileEdit = () => {
        // Réinitialiser avec les valeurs actuelles de l'utilisateur
        if (user) {
            setProfileData({
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || ''
            });
        }
        setIsEditingProfile(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addError('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (passwordData.newPassword.length < 4) {
            addError('Le mot de passe doit contenir au moins 4 caractères', 'error');
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            addError('Le nouveau mot de passe doit être différent de l\'ancien', 'error');
            return;
        }

        try {
            setIsChangingPassword(true);
            await userAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
            addError('Mot de passe modifié avec succès !', 'success');

            // Réinitialiser le formulaire
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error: any) {
            addError(
                error.userMessage || 'Erreur lors du changement de mot de passe',
                'error',
                error.userDetails
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem' }}>Paramètres</h1>

            {/* Informations du profil */}
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Mon profil</h2>
                    {!isEditingProfile && (
                        <button
                            onClick={() => setIsEditingProfile(true)}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            ✏️ Modifier
                        </button>
                    )}
                </div>

                {isEditingProfile ? (
                    <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label htmlFor="email" style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 500
                            }}>
                                Email *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                required
                                disabled={isSavingProfile}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="firstName" style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 500
                            }}>
                                Prénom *
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                value={profileData.firstName}
                                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                required
                                disabled={isSavingProfile}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 500
                            }}>
                                Nom *
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                value={profileData.lastName}
                                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                required
                                disabled={isSavingProfile}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Nom d'utilisateur
                            </strong>
                            <div style={{ color: '#999' }}>{user?.username} (non modifiable)</div>
                        </div>

                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Solde
                            </strong>
                            <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                {user?.balance} radis
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: isSavingProfile ? '#95a5a6' : '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 500
                                }}
                            >
                                {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelProfileEdit}
                                disabled={isSavingProfile}
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: 'white',
                                    color: '#666',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Email
                            </strong>
                            <div>{user?.email}</div>
                        </div>

                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Prénom
                            </strong>
                            <div>{user?.firstName}</div>
                        </div>

                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Nom
                            </strong>
                            <div>{user?.lastName}</div>
                        </div>

                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Nom d'utilisateur
                            </strong>
                            <div>{user?.username}</div>
                        </div>

                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                                Solde
                            </strong>
                            <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                {user?.balance} radis
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Changement de mot de passe */}
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Changer mon mot de passe</h2>

                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label htmlFor="currentPassword" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 500
                        }}>
                            Mot de passe actuel *
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            required
                            disabled={isChangingPassword}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 500
                        }}>
                            Nouveau mot de passe *
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            disabled={isChangingPassword}
                            minLength={4}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                        <small style={{ color: '#666', fontSize: '0.875rem' }}>
                            Minimum 4 caractères
                        </small>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 500
                        }}>
                            Confirmer le nouveau mot de passe *
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                            disabled={isChangingPassword}
                            minLength={4}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: isChangingPassword ? '#95a5a6' : '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                                fontSize: '1rem',
                                fontWeight: 500
                            }}
                        >
                            {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                            })}
                            disabled={isChangingPassword}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: 'white',
                                color: '#666',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
