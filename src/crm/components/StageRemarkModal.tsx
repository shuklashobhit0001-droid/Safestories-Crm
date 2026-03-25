import React, { useState } from 'react';
import './StageRemarkModal.css';

interface StageRemarkModalProps {
    isOpen: boolean;
    fromStage: string;
    toStage: string;
    leadName: string;
    onConfirm: (remark: string) => void;
    onCancel: () => void;
}

const STAGE_LABELS: Record<string, string> = {
    'lead-inquire': 'Lead / Inquire',
    'followup-1': 'Follow ups',
    'pretherapy-call': 'Pre-therapy Call',
    'booked-first-session': 'Booked First Session',
    'dropouts': 'Drop Outs',
    'leaks': 'Leaks',
};

const StageRemarkModal: React.FC<StageRemarkModalProps> = ({
    isOpen,
    fromStage,
    toStage,
    leadName,
    onConfirm,
    onCancel,
}) => {
    const [remark, setRemark] = useState('');
    const [showError, setShowError] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!remark.trim()) {
            setShowError(true);
            return;
        }
        onConfirm(remark.trim());
        setRemark('');
        setShowError(false);
    };

    const handleCancel = () => {
        setRemark('');
        setShowError(false);
        onCancel();
    };

    return (
        <div className="stage-remark-overlay" onClick={handleCancel}>
            <div className="stage-remark-modal" onClick={e => e.stopPropagation()}>
                <div className="stage-remark-header">
                    <h3>{fromStage === toStage ? `Update Follow-up — ${leadName}` : `Stage Update — ${leadName}`}</h3>
                    <p>{fromStage === toStage ? 'Add a note for this follow-up attempt.' : 'Add a remark before confirming the stage change.'}</p>
                </div>

                {fromStage !== toStage && (
                    <div className="stage-arrow">
                        <span className="stage-badge from">{STAGE_LABELS[fromStage] || fromStage}</span>
                        <svg className="stage-arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                        <span className="stage-badge to">{STAGE_LABELS[toStage] || toStage}</span>
                    </div>
                )}

                <label className="stage-remark-label">
                    {fromStage === toStage ? 'Follow-up Notes' : `Remark for "${STAGE_LABELS[toStage] || toStage}" stage`}
                    <span>*</span>
                </label>
                <textarea
                    className={`stage-remark-textarea ${showError ? 'error' : ''}`}
                    placeholder={`What happened at the ${STAGE_LABELS[toStage] || toStage} stage?`}
                    value={remark}
                    onChange={e => {
                        setRemark(e.target.value);
                        if (e.target.value.trim()) setShowError(false);
                    }}
                    autoFocus
                />
                {showError && (
                    <div className="stage-remark-error">A remark is required to proceed.</div>
                )}

                <div className="stage-remark-footer">
                    <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="btn-confirm" onClick={handleConfirm}>Confirm Move</button>
                </div>
            </div>
        </div>
    );
};

export default StageRemarkModal;
