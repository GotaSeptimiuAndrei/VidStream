'use client'

import { Fragment } from 'react'
import { signInWithGoogle, signOut } from '../utils/firebase/firebase'

import styles from './sign-in.module.css'
import { User } from 'firebase/auth'

interface SignInProps {
    user: User | null
}

export default function SignIn({ user }: SignInProps) {
    return (
        <Fragment>
            {user ? (
                <button className={styles.authButton} onClick={signOut}>
                    Sign out
                </button>
            ) : (
                <button
                    className={styles.authButton}
                    onClick={signInWithGoogle}
                >
                    Sign in
                </button>
            )}
        </Fragment>
    )
}
