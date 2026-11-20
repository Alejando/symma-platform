'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  generatePatientAccessCode,
  revokePatientAccessCode,
  getPatientAccessCodeStatus,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useApiErrorHandler } from '@/hooks/use-api-error-handler';

interface PatientAccessCardProps {
  patientId: string;
}

export function PatientAccessCard({ patientId }: PatientAccessCardProps) {
  const t = useTranslations('common');
  const handleApiError = useApiErrorHandler();
  const [error, setError] = useState<string | null>(null);
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getPatientAccessCodeStatus(patientId);
        setHasCode(status.hasAccessCode);
      } catch (statusError) {
        setError(handleApiError(statusError));
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [patientId, handleApiError]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generatePatientAccessCode(patientId);
      setGeneratedPin(result.accessCode);
      setShowPinModal(true);
      setHasCode(true);
    } catch (generateError) {
      setError(handleApiError(generateError));
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(t('mobileAccess.confirmRevoke'))) return;

    setRevoking(true);
    setError(null);
    try {
      await revokePatientAccessCode(patientId);
      setHasCode(false);
    } catch (revokeError) {
      setError(handleApiError(revokeError));
    } finally {
      setRevoking(false);
    }
  };

  const formatPin = (pin: string) => {
    return `${pin.slice(0, 3)}-${pin.slice(3)}`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#e7f3f2] rounded-xl p-4 md:p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-[#e7f3f2] rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-brand">smartphone</span>
          <h3 className="text-base md:text-lg font-semibold text-[#0d1b1a]">{t('mobileAccess.title')}</h3>
        </div>

        <ErrorAlert message={error} className="mb-4" />

        {hasCode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="material-symbols-outlined text-green-700">check_circle</span>
              <span className="text-sm font-medium text-green-800">{t('mobileAccess.accessActive')}</span>
            </div>
            <p className="text-xs text-gray-500">
              {t('mobileAccess.patientCanLogin')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                {generating ? t('mobileAccess.generating') : t('mobileAccess.regeneratePin')}
              </Button>
              <Button
                variant="ghost"
                onClick={handleRevoke}
                disabled={revoking}
                className="text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-lg">block</span>
                {revoking ? t('mobileAccess.revoking') : t('mobileAccess.revoke')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="material-symbols-outlined text-gray-500">lock</span>
              <span className="text-sm font-medium text-gray-600">{t('mobileAccess.noActiveAccess')}</span>
            </div>
            <p className="text-xs text-gray-500">
              {t('mobileAccess.generatePinDescription')}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full text-sm font-medium text-white bg-brand hover:bg-brand-hover shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">key</span>
              {generating ? t('mobileAccess.generating') : t('mobileAccess.generateMobilePin')}
            </Button>
          </div>
        )}
      </div>

      {/* PIN Display Modal */}
      {showPinModal && generatedPin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-brand text-3xl">pin</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('mobileAccess.patientAccessPin')}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('mobileAccess.shareCodeDescription')}
            </p>

            <div className="bg-gray-100 rounded-xl p-6 mb-6">
              <p className="text-4xl font-mono font-bold text-brand tracking-widest">
                {formatPin(generatedPin)}
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6 text-left">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">warning</span>
              <p className="text-xs text-amber-800" dangerouslySetInnerHTML={{ __html: t.raw('mobileAccess.pinWarning') }} />
            </div>

            <Button
              onClick={() => {
                setShowPinModal(false);
                setGeneratedPin(null);
              }}
              className="w-full bg-brand text-white font-medium hover:bg-brand-hover"
            >
              {t('mobileAccess.done')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
