import { useState, useEffect } from 'react'
import { Search, Download } from 'lucide-react'
import AddLeadModal from './AddLeadModal'
import './LeadsContent.css'
import { Loader } from '../../../components/Loader'

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  source: string
  leadManager: string
  assignedTherapist: string
  status: string
  stage: string
  remarks: string
  createdDate: string
}

const STAGES = [
  { id: 'all', label: 'All Leads' },
  { id: 'lead-inquire', label: 'Lead / Inquire' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'followup-1', label: 'Follow-up 1' },
  { id: 'followup-2', label: 'Follow-up 2' },
  { id: 'followup-3', label: 'Follow-up 3' },
  { id: 'pretherapy-call', label: 'Pre-therapy Call' },
  { id: 'booked-first-session', label: 'Booked First Session' },
  { id: 'dropouts', label: 'Drop Outs' },
  { id: 'leaks', label: 'Leaks' },
]

const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.filter(s => s.id !== 'all').map(s => [s.id, s.label])
)

interface LeadsContentProps {
  setCurrentPage?: (page: string) => void
}

const LeadsContent = ({ setCurrentPage }: LeadsContentProps) => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        const mappedLeads = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email || '',
          source: d.source,
          leadManager: d.sales_agent_name || d.sales_agent_id || 'Unassigned',
          assignedTherapist: d.therapist_name || d.therapist_id || 'Unassigned',
          status: d.status,
          stage: d.pipeline_stage || 'lead-inquire',
          remarks: d.general_remarks || '',
          createdDate: d.created_at
        }))
        setLeads(mappedLeads)
      }
    } catch (error) {
      console.error('Failed to fetch leads', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const filteredLeads = leads
    .filter(l => activeTab === 'all' || l.stage === activeTab)
    .filter(l => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        l.name.toLowerCase().includes(query) ||
        l.phone.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query)
      )
    })

  const calculateAging = (createdDate: string): string => {
    const created = new Date(createdDate)
    const today = new Date()
    const diffDays = Math.floor(Math.abs(today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day'
    return `${diffDays} days`
  }

  const getAgingColor = (createdDate: string): string => {
    const created = new Date(createdDate)
    const today = new Date()
    const diffDays = Math.floor(Math.abs(today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 10) return '#21615D' // Green
    if (diffDays <= 15) return '#F4A936' // Yellow
    return '#B91C1C' // Red
  }

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'New': 'status-new',
      'Contacted': 'status-contacted',
      'Pre-Therapy Call': 'status-pretherapy',
      'Booked': 'status-booked',
      'Converted': 'status-converted',
      'Lost': 'status-lost'
    }
    return statusMap[status] || 'status-default'
  }

  const countForTab = (tabId: string) =>
    tabId === 'all' ? leads.length : leads.filter(l => l.stage === tabId).length

  const exportToCSV = () => {
    const headers = ['Lead Name', 'Phone', 'Email', 'Source', 'Lead Manager', 'Assigned Therapist', 'Stage', 'Aging'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.phone,
      lead.email,
      lead.source,
      lead.leadManager,
      lead.assignedTherapist,
      STAGE_LABEL[lead.stage] || lead.stage,
      calculateAging(lead.createdDate)
    ]);
    
    // escaping commas in names/remarks if any (though here we only have simple fields)
    const csvContent = [
      headers.join(','), 
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="leads-content relative min-h-full">
      {loading ? (
        <Loader />
      ) : (
        <>
      <header className="leads-header">
        <div>
          <h1>Leads</h1>
          <p className="leads-subtitle">Manage your inquiries and leads</p>
        </div>
        <button className="add-lead-btn" onClick={() => setIsModalOpen(true)}>
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Lead
        </button>
      </header>

      <div className="relative mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search leads by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={exportToCSV}
          className="bg-teal-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800 whitespace-nowrap text-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Stage Tabs */}
      <div className="stage-tabs">
        {STAGES.map(tab => (
          <button
            key={tab.id}
            className={`stage-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="tab-count">{countForTab(tab.id)}</span>
          </button>
        ))}
      </div>

      <div className="leads-table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Contact Info</th>
              <th>Source</th>
              <th>Lead Manager</th>
              <th>Stage</th>
              <th>Aging</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  No leads in this stage
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="lead-table-row"
                >
                  <td className="lead-name">
                    <span 
                      onClick={() => setCurrentPage && setCurrentPage(`lead-profile:${lead.id}`)}
                      className="text-teal-700 hover:underline cursor-pointer font-medium"
                    >
                      {lead.name}
                    </span>
                  </td>
                  <td className="contact-info">
                    <div className="contact-phone">{lead.phone}</div>
                    <div className="contact-email">{lead.email}</div>
                  </td>
                  <td>{lead.source}</td>
                  <td>{lead.leadManager}</td>
                  <td>
                    <span className="stage-pill">
                      {STAGE_LABEL[lead.stage] || lead.stage}
                    </span>
                  </td>
                  <td className="aging">
                    <span style={{ 
                      color: getAgingColor(lead.createdDate),
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: `${getAgingColor(lead.createdDate)}15` // 15% opacity background
                    }}>
                      {calculateAging(lead.createdDate)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={fetchLeads}
      />
      </>
      )}
    </div>
  )
}

export default LeadsContent
