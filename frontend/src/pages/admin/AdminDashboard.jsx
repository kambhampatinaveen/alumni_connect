import React, { useState, useEffect } from 'react';
import Header from '../../components/admin/Header';
import SummaryCards from '../../components/admin/SummaryCards';
import AlumniCardsGrid from '../../components/admin/AlumniCardsGrid';
import IndustryPieChart from '../../components/admin/charts/IndustryPieChart';
import EventAreaChart from '../../components/admin/charts/EventAreaChart';
import MentorshipDomainBarChart from '../../components/admin/charts/MentorshipDomainBarChart';
import EngagedAlumniTable from '../../components/admin/EngagedAlumniTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { getAlumni } from '../../api/managementApi';
import { 
  getOverview, 
  getByDepartment, 
  getByIndustry, 
  getEngagementTrend, 
  getMentorshipDomains, 
  getEventParticipation 
} from '../../api/analyticsApi';
import { Filter, Calendar, TrendingUp, Search, X } from 'lucide-react';

export default function AdminDashboard({ onToggleSidebar }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Active Metric Filter & Search Query
  const [activeFilter, setActiveFilter] = useState('activeAlumni');
  const [searchQuery, setSearchQuery] = useState('');

  // Date & Dept Filters
  const [timeframe, setTimeframe] = useState('8m');
  const [department, setDepartment] = useState('all');

  // Analytics & Alumni State
  const [overview, setOverview] = useState(null);
  const [liveAlumni, setLiveAlumni] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [engagementTrend, setEngagementTrend] = useState([]);
  const [mentorshipDomains, setMentorshipDomains] = useState([]);
  const [eventParticipation, setEventParticipation] = useState([]);

  const fetchAllAnalytics = async (isRefetch = false) => {
    if (isRefetch) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [
        overviewRes,
        deptRes,
        industryRes,
        trendRes,
        domainsRes,
        eventsRes,
        alumniRes
      ] = await Promise.all([
        getOverview({ timeframe, department }),
        getByDepartment(),
        getByIndustry(),
        getEngagementTrend({ timeframe }),
        getMentorshipDomains(),
        getEventParticipation(),
        getAlumni()
      ]);

      setOverview(overviewRes.data);
      setDepartmentData(deptRes.data);
      setIndustryData(industryRes.data);
      setEngagementTrend(trendRes.data);
      setMentorshipDomains(domainsRes.data);
      setEventParticipation(eventsRes.data);
      setLiveAlumni(alumniRes.data?.data || alumniRes.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setOverview({
        totalAlumni: 0,
        activeAlumni: 0,
        inactiveAlumni: 0,
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        mentors: 0,
        connections: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [timeframe, department]);

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header 
        title="Admin Analytics & Platform Overview" 
        subtitle="Platform engagement performance & key institutional metrics"
        onRefresh={() => fetchAllAnalytics(true)}
        isRefreshing={refreshing}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
            <Filter className="w-4 h-4 text-[#0F4C81]" />
            <span>Telemetry & Date Filter</span>
          </div>

          {/* Search Bar under Telemetry Filter */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search alumni by name, company, role, skills, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <button
                onClick={() => setTimeframe('3m')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === '3m' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3 Months
              </button>
              <button
                onClick={() => setTimeframe('6m')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === '6m' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setTimeframe('8m')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  timeframe === '8m' ? 'bg-[#0F4C81] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Academic Year 2024-25
              </button>
            </div>

            {/* Department Filter */}
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-white text-slate-800 border border-slate-200 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Eng">Electrical Eng</option>
              <option value="Mechanical Eng">Mechanical Eng</option>
              <option value="Business Admin">Business Admin</option>
              <option value="Biotechnology">Biotechnology</option>
            </select>
          </div>
        </div>

        {/* Global Loading / Error */}
        {loading ? (
          <LoadingSpinner message="Fetching real-time platform metrics..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={() => fetchAllAnalytics()} />
        ) : (
          <>
            {/* 1. 6 KPI Summary Cards (Interactive - Click to Filter) */}
            <SummaryCards 
              data={overview} 
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
            />

            {/* 2. Dynamic Alumni Cards Grid ("small small small boxes" matching Image 2) */}
            <AlumniCardsGrid
              alumniList={liveAlumni}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* 3. Analytics Charts Grid (Alumni by Industry, Event Participation, Most Common Mentorship Domains) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <IndustryPieChart data={industryData} />
              </div>
              <div>
                <EventAreaChart data={eventParticipation} />
              </div>
              <div>
                <MentorshipDomainBarChart data={mentorshipDomains} />
              </div>
            </div>

            {/* 4. Top Engaged Alumni Leaderboard */}
            <EngagedAlumniTable alumni={overview?.topEngagedAlumni || []} />
          </>
        )}
      </main>
    </div>
  );
}
