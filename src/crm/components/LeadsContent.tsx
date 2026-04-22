import { useState, useEffect } from 'react'
import { Search, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import AddLeadModal from './AddLeadModal'
import MonthFilter from './MonthFilter'
import './LeadsContent.css'
import './MonthFilter.css'
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
  { id: 'pretherapy-call', label: 'Pre-therapy Call' },
  { id: 'followup-1', label: 'Follow Ups' },
  { id: 'booked-first-session', label: 'Booked First Session' },
  { id: 'referred', label: 'Referred' },
  { id: 'closed', label: 'Closed' },
  { id: 'dropouts', label: 'Unresponsive' },
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
  const [selectedMonth, setSelectedMonth] = useState('All Time')

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        const mappedLeads = data.map((d: any) => {
          // Pick the latest follow-up timestamp for the 'Follow ups' stage display
          let displayDate = d.created_at;
          if (d.pipeline_stage === 'followup-1') {
            displayDate = [d.stage_followup_3_at, d.stage_followup_2_at, d.stage_followup_1_at, d.created_at].find(date => date != null) || d.created_at;
          } else {
            const stageDateMap: Record<string, string> = {
              'pretherapy-call': d.stage_pretherapy_call_at,
              'booked-first-session': d.stage_booked_first_session_at,
              'dropouts': d.stage_dropouts_at,
              'leaks': d.stage_leaks_at
            };
            displayDate = stageDateMap[d.pipeline_stage] || d.created_at;
          }

          return {
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
            createdDate: displayDate
          };
        })
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
      if (selectedMonth && selectedMonth !== 'All Time') {
        const [monthName, year] = selectedMonth.split(' ')
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
        const leadDate = new Date(l.createdDate)
        if (leadDate.getMonth() !== monthIndex || leadDate.getFullYear() !== parseInt(year)) return false
      }
      return true
    })
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

  const countForTab = (tabId: string) => {
    const base = tabId === 'all' ? leads : leads.filter(l => l.stage === tabId)
    if (!selectedMonth || selectedMonth === 'All Time') return base.length
    const [monthName, year] = selectedMonth.split(' ')
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth()
    return base.filter(l => {
      const d = new Date(l.createdDate)
      return d.getMonth() === monthIndex && d.getFullYear() === parseInt(year)
    }).length
  }

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
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.writeFile(wb, `crm_leads_${new Date().toISOString().split('T')[0]}.xlsx`)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MonthFilter selectedMonth={selectedMonth} onChange={setSelectedMonth} />
          <button className="add-lead-btn" onClick={() => setIsModalOpen(true)}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Lead
          </button>
        </div>
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
          Export Excel
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
                      onClick={() => setCurrentPage && setCurrentPage(`lead-profile:${lead.id}:leads`)}
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
