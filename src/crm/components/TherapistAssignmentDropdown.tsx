import { useState, useEffect, useRef } from 'react'

interface Therapist {
  id: string
  name: string
  full_name?: string
}

interface TherapistAssignmentDropdownProps {
  leadId: string
  currentTherapist?: string
  onAssign: (therapistId: string, therapistName: string) => void
}

const TherapistAssignmentDropdown = ({ leadId, currentTherapist, onAssign }: TherapistAssignmentDropdownProps) => {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await fetch('/api/therapists')
        if (response.ok) {
          const data = await response.json()
          setTherapists(data)
        }
      } catch (error) {
        console.error('Failed to fetch therapists:', error)
      }
    }
    fetchTherapists()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleAssign = async (therapistId: string, therapistName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/assign-therapist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapist_id: therapistId })
      })

      if (response.ok) {
        onAssign(therapistId, therapistName)
        setIsOpen(false)
      } else {
        console.error('Failed to assign therapist')
      }
    } catch (error) {
      console.error('Error assigning therapist:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="therapist-assignment-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="assign-therapist-btn"
        disabled={loading}
        style={{
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          whiteSpace: 'nowrap'
        }}
      >
        {loading ? 'Assigning...' : 'Assign Therapist'}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '200px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {therapists.length === 0 ? (
            <div style={{ padding: '12px', color: '#6b7280', fontSize: '12px' }}>
              No therapists available
            </div>
          ) : (
            therapists.map(therapist => (
              <button
                key={therapist.id}
                onClick={() => handleAssign(therapist.id, therapist.full_name || therapist.name)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#374151',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {therapist.full_name || therapist.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TherapistAssignmentDropdown