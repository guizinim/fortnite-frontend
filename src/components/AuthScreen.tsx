import { FormEvent, useState } from 'react'

type Props = {
	onLogin: (email: string, password: string) => Promise<void> | void
	onRegister: (name: string, email: string, password: string) => Promise<void> | void
	loading: boolean
	error: string | null
}

type Mode = 'login' | 'register'

export default function AuthScreen({ onLogin, onRegister, loading, error }: Props) {
	const [mode, setMode] = useState<Mode>('login')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const submit = (e: FormEvent) => {
		e.preventDefault()
		if (mode === 'login') {
			onLogin(email, password)
		} else {
			onRegister(name, email, password)
		}
	}

	const toggleMode = () => {
		setMode(mode === 'login' ? 'register' : 'login')
		setPassword('')
	}

	return (
		<section className="auth section" id="auth">
			<div className="container" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
				<form className="auth-form auth-form--solo" onSubmit={submit} noValidate>
					<h2 className="section-title" style={{ marginTop: 0 }}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
					<p className="section-subtitle" style={{ marginBottom: 16 }}>
						{mode === 'login'
							? 'Acesse sua conta para gerenciar seus cosméticos.'
							: 'Crie sua conta e receba 10.000 V-Bucks para começar.'}
					</p>
					<div className="form-row">
						{mode === 'register' && (
							<div className="form-field">
								<label htmlFor="name">Nome</label>
								<input
									id="name"
									name="name"
									type="text"
									placeholder="Seu nome"
									value={name}
									onChange={(e) => setName(e.target.value)}
									disabled={loading}
									required
								/>
							</div>
						)}
						<div className="form-field">
							<label htmlFor="email">E-mail</label>
							<input
								id="email"
								name="email"
								type="email"
								placeholder="voce@exemplo.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={loading}
								required
							/>
						</div>
					</div>

					<div className="form-row">
						<div className="form-field">
							<label htmlFor="password">Senha</label>
							<input
								id="password"
								name="password"
								type="password"
								placeholder="Sua senha"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={loading}
								required
							/>
						</div>
						<div className="form-field" />
					</div>

					<div className="form-actions">
						<button className="btn primary" type="submit" disabled={loading}>
							{loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
						</button>
						{error && <span className="form-status error" role="status" aria-live="polite">{error}</span>}
					</div>
					<button className="btn secondary" type="button" onClick={toggleMode} disabled={loading} style={{ marginTop: 8 }}>
						{mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já possui conta? Entrar'}
					</button>
				</form>
			</div>
		</section>
	)
}


