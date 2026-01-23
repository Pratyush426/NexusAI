import React, { useEffect, useState } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, MoreVertical, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { fetchApplications } from '../lib/api';

const JobCard = ({ job }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Interview': return 'bg-purple-100 text-purple-700';
            case 'Offer': return 'bg-emerald-100 text-emerald-700';
            case 'Rejected': return 'bg-rose-100 text-rose-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <Card className="hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-slate-700 border border-slate-200 group-hover:scale-105 transition-transform">
                            {job.companyName ? job.companyName[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{job.companyName || 'Unknown Company'}</h3>
                            <p className="text-slate-500 text-sm">{job.jobRole || 'Unknown Role'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary || 'Market Rate'}
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {job.date || 'Recent'}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", getStatusColor(job.status))}>
                        {job.status || 'Applied'}
                    </span>
                    <Button variant="link" className="text-slate-600 hover:text-primary p-0 h-auto">
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const Jobs = () => {
    const [apps, setApps] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchApplications();
            setApps(data);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading jobs...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Applications</h1>
                    <p className="text-slate-500">Manage and track your job applications</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Application</span>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        className="pl-10"
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-5 h-5" />
                    <span>Filters</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.filter(job =>
                    (job.companyName && job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (job.jobRole && job.jobRole.toLowerCase().includes(searchTerm.toLowerCase()))
                ).map((job, index) => (
                    <JobCard key={job._id || index} job={job} />
                ))}
            </div>
        </div>
    );
};

export default Jobs;
