import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaWallet, FaSignInAlt, FaCheckCircle } from 'react-icons/fa';
import AuthService from '../services/authService';
import MetaMaskGuideModal from './MetaMaskGuideModal';

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [challenge, setChallenge] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [step, setStep] = useState('connect'); // connect, sign, verify
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    if (AuthService.isAuthenticated()) {
      onLoginSuccess && onLoginSuccess(AuthService.getCurrentUser());
    }

    // Listen for account changes
    AuthService.onAccountChange((account) => {
      if (!account) {
        setWalletAddress('');
        setStep('connect');
        setError('Wallet disconnected');
      } else {
        setWalletAddress(account);
      }
    });

    // Listen for chain changes
    AuthService.onChainChange((chainId) => {
      console.log('Chain changed:', chainId);
      // You might want to validate the chain here
    });
  }, [onLoginSuccess]);

  const handleConnectWallet = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!AuthService.isMetaMaskInstalled()) {
        setShowGuide(true);
        return;
      }

      const result = await AuthService.connectWallet();
      setWalletAddress(result.walletAddress);
      setChallenge(result.challenge);
      setChallengeId(result.challengeId);
      setStep('sign');
      setSuccess('Wallet connected successfully! Please sign the message to continue.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignAndVerify = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.signAndVerify(challengeId, challenge);
      setStep('verify');
      setSuccess('Authentication successful! Redirecting...');

      // Call success callback after a short delay
      setTimeout(() => {
        onLoginSuccess && onLoginSuccess(result.user);
      }, 1500);
    } catch (error) {
      setError(error.message);
      setStep('connect');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAuth = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await AuthService.authenticate();
      setSuccess('Authentication successful! Redirecting...');

      // Call success callback after a short delay
      setTimeout(() => {
        onLoginSuccess && onLoginSuccess(result.user);
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('connect');
    setWalletAddress('');
    setChallenge('');
    setChallengeId('');
    setError('');
    setSuccess('');
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <Card className="shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <FaWallet size={48} className="text-primary mb-3" />
              <h2 className="fw-bold">Web3 HR System</h2>
              <p className="text-muted">Đăng nhập bằng ví MetaMask của bạn</p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-3">
                <FaCheckCircle className="me-2" />
                {success}
              </Alert>
            )}

            <div className="mb-4">
              {step === 'connect' && (
                <div className="text-center">
                  <p className="mb-3">Kết nối ví MetaMask để tiếp tục</p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleConnectWallet}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang kết nối...
                      </>
                    ) : (
                      <>
                        <FaWallet className="me-2" />
                        Kết nối ví MetaMask
                      </>
                    )}
                  </Button>
                </div>
              )}

              {step === 'sign' && (
                <div className="text-center">
                  <div className="mb-3">
                    <small className="text-muted">Ví đã kết nối:</small>
                    <div className="font-monospace bg-light p-2 rounded">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                  </div>
                  <p className="mb-3">Vui lòng ký thông điệp để xác thực danh tính</p>
                  <div className="bg-light p-3 rounded mb-3 text-start">
                    <small className="text-muted">Thông điệp cần ký:</small>
                    <div className="font-monospace small mt-1">
                      {challenge}
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleSignAndVerify}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Đang ký...
                        </>
                      ) : (
                        <>
                          <FaSignInAlt className="me-2" />
                          Ký và đăng nhập
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Quay lại
                    </Button>
                  </div>
                </div>
              )}

              {step === 'verify' && (
                <div className="text-center">
                  <FaCheckCircle size={48} className="text-success mb-3" />
                  <p>Đang xác thực...</p>
                  <Spinner animation="border" />
                </div>
              )}
            </div>

            <div className="text-center">
              <small className="text-muted">
                Chưa có MetaMask?{' '}
                <Button
                  variant="link"
                  className="p-0 text-decoration-none"
                  onClick={() => setShowGuide(true)}
                >
                  Xem hướng dẫn cài đặt
                </Button>
              </small>
            </div>
          </Card.Body>
        </Card>
      </div>

      <MetaMaskGuideModal
        show={showGuide}
        onHide={() => setShowGuide(false)}
      />
    </>
  );
};

export default Login;
