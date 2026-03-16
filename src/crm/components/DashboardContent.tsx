import { useState, useEffect } from 'react'
import MonthFilter from './MonthFilter'
import { Loader } from '../../../components/Loader'

const DashboardContent = () => {
  const [loading, setLoading] = useState(true)
  const [sourceMonth, setSourceMonth] = useState('March 2026')
  const [funnelMonth, setFunnelMonth] = useState('March 2026')
  const [totalLeads, setTotalLeads] = useState(0)
  const [dropouts, setDropouts] = useState(0)
  const [leaks, setLeaks] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [leadSources, setLeadSources] = useState([
    { name: 'Chatbot', value: 0 },
    { name: 'Website', value: 0 },
    { name: 'Direct', value: 0 },
    { name: 'Social Media', value: 0 },
    { name: 'Other', value: 0 },
  ])
  const [funnelStages, setFunnelStages] = useState([
    { label: 'Inquiry/Lead', value: 0, percentage: 100 },
    { label: 'Contacted', value: 0, percentage: 0 },
    { label: 'Pre-Therapy Call', value: 0, percentage: 0 },
    { label: 'Booked First Session', value: 0, percentage: 0 },
    { label: 'Continued Session Beyond 3', value: 0, percentage: 0 }
  ])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (sourceMonth) queryParams.append('sourceMonth', sourceMonth);
        if (funnelMonth) queryParams.append('funnelMonth', funnelMonth);
        const response = await fetch(`/api/analytics?${queryParams.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setTotalLeads(data.totalLeads)
          if (data.dropouts !== undefined) setDropouts(data.dropouts)
          if (data.leaks !== undefined) setLeaks(data.leaks)
          if (data.sources) {
            const defaultSources = [
              { name: 'Chatbot', value: 0 },
              { name: 'Website', value: 0 },
              { name: 'Direct', value: 0 },
              { name: 'Social Media', value: 0 },
              { name: 'Other', value: 0 },
            ];
            setLeadSources(defaultSources.map(ds => {
              const matched = data.sources.find((s: any) => s.name?.toLowerCase() === ds.name.toLowerCase());
              return matched ? { ...ds, value: matched.value } : ds;
            }));
          }

          if (data.funnel) {
            const getStageValue = (dbStage: string) => {
              return data.funnel.find((f: any) => f.label === dbStage)?.value || 0;
            };

            const inquiryValue = getStageValue('lead-inquire');
            const contactedValue = getStageValue('contacted');
            const preTherapyValue = getStageValue('pretherapy-call');
            const bookedValue = getStageValue('booked-first-session');
            // assuming 'continued-session' might map to something or just 0 for now as it doesn't exist in the pipeline_stage enum
            const continuedValue = 0;

            const calcPercentage = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;
            const topOfFunnel = Math.max(inquiryValue, 1); // Avoid div by zero

            setFunnelStages([
              { label: 'Inquiry/Lead', value: inquiryValue, percentage: calcPercentage(inquiryValue, inquiryValue) || 100 },
              { label: 'Contacted', value: contactedValue, percentage: calcPercentage(contactedValue, topOfFunnel) },
              { label: 'Pre-Therapy Call', value: preTherapyValue, percentage: calcPercentage(preTherapyValue, topOfFunnel) },
              { label: 'Booked First Session', value: bookedValue, percentage: calcPercentage(bookedValue, topOfFunnel) },
              { label: 'Continued Session Beyond 3', value: continuedValue, percentage: 0 }
            ]);
            
            if (data.allTimeConversionRate !== undefined) {
              setConversionRate(data.allTimeConversionRate);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch analytics', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [sourceMonth, funnelMonth])

  const modules = [
    { id: 1, title: 'Total Leads', value: totalLeads.toString() },
    { id: 2, title: 'Lead to first session conversion', value: `${conversionRate}%` },
    { id: 3, title: 'Drop outs', value: dropouts.toString() },
    { id: 4, title: 'Leaks', value: leaks.toString() },
  ]

  const revenueData = [
    { date: '1', value: 12000 },
    { date: '5', value: 18000 },
    { date: '10', value: 25000 },
    { date: '15', value: 22000 },
    { date: '20', value: 30000 },
    { date: '25', value: 35000 },
    { date: '28', value: 42000 },
  ]


  const maxRevenue = Math.max(...revenueData.map(d => d.value))
  const currentMonthRevenue = '₹42,000'
  const maxValue = Math.max(...leadSources.map(s => s.value), 4)

  return (
    <div className="w-full bg-gray-50 relative min-h-full">
      {loading ? (
        <Loader />
      ) : (
        <>
          <header className="mb-8 pt-8 pl-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Analytics</h1>
              <p className="text-gray-600 text-sm">Welcome Pooja Jain, to SafeStories CRM Analytics!</p>
            </div>
          </header>

          <div className="pl-8 pb-8">

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {modules.map((module) => (
                <div key={module.id} className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md p-6">
                  <div className="text-sm text-gray-600 mb-2">{module.title}</div>
                  <div className="text-3xl font-bold text-gray-900">{module.value}</div>
                </div>
              ))}
            </div>

            {/* Lead Source Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md mb-8">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Lead Source</h2>
                <MonthFilter selectedMonth={sourceMonth} onChange={setSourceMonth} />
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col justify-between text-xs text-gray-500 w-12">
                    {[maxValue, Math.floor(maxValue * 0.75), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.25), 0].map((tick, i) => (
                      <div key={i} className="text-right">{tick}</div>
                    ))}
                  </div>
                  <div className="flex-1 flex items-end justify-around gap-3 border-l border-b border-gray-200 pl-4 pb-4">
                    {leadSources.map((source, i) => (
                      <div key={i} className="flex flex-col items-center justify-end gap-2 flex-1 h-[200px]">
                        <div className="w-full flex justify-center items-end h-full">
                          <div
                            className="w-12 rounded-t flex items-start justify-center pt-2"
                            style={{ height: `${Math.max((source.value / maxValue) * 200, 24)}px`, backgroundColor: '#21615D' }}
                          >
                            <span className="text-white text-xs font-bold">{source.value}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 text-center">{source.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Conversion Funnel</h2>
                  <MonthFilter selectedMonth={funnelMonth} onChange={setFunnelMonth} />
                </div>
                <div className="p-6 space-y-3">
                  {funnelStages.map((stage, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 rounded-lg text-white flex justify-between items-center transition-all hover:shadow-md"
                      style={{
                        backgroundColor: '#21615D',
                        width: `${100 - i * 15}%`
                      }}
                    >
                      <span className="font-medium">{stage.label}</span>
                      <div>
                        <span className="font-bold">{stage.value}</span>
                        <span className="ml-2 text-sm opacity-80">({stage.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardContent
