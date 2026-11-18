import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

export default function OnboardingChecklist() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      setLoading(false);
      return;
    }
    
    const fetchStatus = async () => {
      try {
        const data = await onboardingAPI.getStatus();
        if (data.isComplete) {
          setUser(prev => ({ ...prev, onboardingCompleted: true }));
        } else {
          setStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch onboarding status', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [user?.onboardingCompleted, setUser]);

  if (loading || user?.onboardingCompleted || dismissed || !status) return null;

  const steps = [
    {
      title: 'Add your first client',
      description: 'Create a profile to organize content.',
      completed: status.hasClients,
      action: () => navigate('/app/clients')
    },
    {
      title: 'Set up Brand Memory',
      description: 'Teach AI your brand voice.',
      completed: status.hasBrand,
      action: () => navigate('/app/brand-voice')
    },
    {
      title: 'Generate content',
      description: 'Create your first piece of copy.',
      completed: status.hasGenerated,
      action: () => navigate('/app/generate')
    }
  ];

  const progress = steps.filter(s => s.completed).length;
  const isAllDone = progress === steps.length;

  const handleDismiss = async () => {
    try {
      setDismissed(true);
      if (isAllDone) {
        await onboardingAPI.completeStep({ stepId: 'all' });
        setUser(prev => ({ ...prev, onboardingCompleted: true }));
      }
    } catch (err) {
      console.error('Failed to complete onboarding', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '320px',
      backgroundColor: '#12121a',
      border: '1px solid #1e1e2e',
      borderRadius: '20px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#050508',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Getting Started</h3>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(209,209,224,0.4)', fontWeight: 600 }}>{progress} of 3 completed</p>
        </div>
        <button 
          onClick={() => setDismissed(true)} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(209,209,224,0.3)', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>
      
      <div style={{ padding: '8px' }}>
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            onClick={!step.completed ? step.action : undefined}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '14px',
              transition: 'background-color 0.2s',
              cursor: step.completed ? 'default' : 'pointer',
              opacity: step.completed ? 0.4 : 1
            }}
            className={!step.completed ? "hover-item-bg" : ""}
          >
            <div style={{
              marginTop: '2px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid',
              borderColor: step.completed ? '#c9a84c' : 'rgba(209,209,224,0.2)',
              backgroundColor: step.completed ? '#c9a84c' : 'transparent',
              color: step.completed ? '#050508' : 'transparent',
              flexShrink: 0
            }}>
              <Check size={12} strokeWidth={3} />
            </div>
            <div>
              <p style={{ 
                margin: 0, 
                fontSize: '13px', 
                fontWeight: 700, 
                color: '#ffffff',
                textDecoration: step.completed ? 'line-through' : 'none'
              }}>
                {step.title}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(209,209,224,0.4)', lineHeight: '1.4' }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {isAllDone && (
        <div style={{ padding: '16px', borderTop: '1px solid #1e1e2e', backgroundColor: 'rgba(201, 168, 76, 0.05)' }}>
          <button 
            onClick={handleDismiss}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#c9a84c',
              color: '#050508',
              border: 'none',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Finish Onboarding
          </button>
        </div>
      )}

      <style>{`
        .hover-item-bg:hover { background-color: rgba(255,255,255,0.03); }
      `}</style>
    </div>
  );
}
