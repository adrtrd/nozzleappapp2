import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // feel
    const result = login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      direction:      'rtl',
    }}>
      {/* CSS Spin Keyframe Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        background:   'var(--color-background-primary, #ffffff)',
        borderRadius: '20px',
        padding:      '40px',
        width:        '380px',
        border:       '1px solid var(--color-border-tertiary, #E2E8F0)',
        boxShadow:    '0 25px 60px rgba(0,0,0,0.4)',
      }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{
            width:          '64px',
            height:         '64px',
            borderRadius:   '16px',
            background:     'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 14px',
          }}>
            <Car size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', margin:0, color: 'var(--color-text-primary, #0F172A)' }}>
            مركز إدارة السيارات
          </h1>
          <p style={{
            color:    'var(--color-text-secondary, #64748B)',
            fontSize: '13px',
            margin:   '5px 0 0',
          }}>
            سجل دخولك للمتابعة
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom:'14px' }}>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '11px 14px',
              background:   'var(--color-background-secondary, #F8FAFC)',
              border:       '1px solid var(--color-border-tertiary, #E2E8F0)',
              borderRadius: '10px',
            }}>
              <Mail size={16}
                color="var(--color-text-secondary, #64748B)" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                style={{
                  flex:       1,
                  border:     'none',
                  background: 'transparent',
                  color:      'var(--color-text-primary, #0F172A)',
                  fontSize:   '14px',
                  outline:    'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom:'20px' }}>
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '11px 14px',
              background:   'var(--color-background-secondary, #F8FAFC)',
              border:       '1px solid var(--color-border-tertiary, #E2E8F0)',
              borderRadius: '10px',
            }}>
              <Lock size={16}
                color="var(--color-text-secondary, #64748B)" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                style={{
                  flex:       1,
                  border:     'none',
                  background: 'transparent',
                  color:      'var(--color-text-primary, #0F172A)',
                  fontSize:   '14px',
                  outline:    'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  border:     'none',
                  background: 'transparent',
                  cursor:     'pointer',
                  color:      'var(--color-text-secondary, #64748B)',
                  padding:    0,
                }}
              >
                {showPass
                  ? <EyeOff size={15} />
                  : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:        '100%',
              padding:      '12px',
              background:   loading
                ? '#4F46E5'
                : 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color:        '#fff',
              border:       'none',
              borderRadius: '10px',
              fontSize:     '15px',
              fontWeight:   '600',
              cursor:       loading ? 'not-allowed' : 'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              gap:          '8px',
              transition:   'opacity 0.2s',
              fontFamily:   'inherit',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width:        '16px',
                  height:       '16px',
                  border:       '2px solid rgba(255,255,255,0.3)',
                  borderTop:    '2px solid #fff',
                  borderRadius: '50%',
                  animation:    'spin 0.8s linear infinite',
                }} />
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Default admin hint */}
        <div style={{
          marginTop:    '16px',
          padding:      '10px',
          background:   'var(--color-background-secondary, #F8FAFC)',
          borderRadius: '8px',
          fontSize:     '12px',
          color:        'var(--color-text-secondary, #64748B)',
          textAlign:    'center',
        }}>
          الحساب الافتراضي: admin@center.com / admin123
        </div>
      </div>
    </div>
  );
}

export default Login;
