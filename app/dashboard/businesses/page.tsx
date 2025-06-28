'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SafeImage } from '@/components/ui/safe-image';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBusinesses, useDeleteUserBusiness } from '@/hooks/use-user';
import { PlaceResults } from '@/types/place';
import {
  Building2,
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    scraped: 'bg-blue-100 text-blue-800 border-blue-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200',
    draft: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <Badge
      variant="outline"
      className={
        statusColors[status as keyof typeof statusColors] ||
        'bg-gray-100 text-gray-800 border-gray-200'
      }
    >
      {status}
    </Badge>
  );
}

// Actions dropdown component
function ActionsDropdown({ business }: { business: PlaceResults }) {
  const router = useRouter();
  const deleteBusinessMutation = useDeleteUserBusiness();

  const handleView = () => {
    router.push(`/place/${business.id}`);
  };

  const handleEdit = () => {
    toast.info('Edit functionality coming soon!', {
      description: "We're working on business editing features.",
    });
  };

  const handleDelete = async () => {
    try {
      await deleteBusinessMutation.mutateAsync(business.id);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View Business
          <ExternalLink className="ml-auto h-3 w-3" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Business
          <Badge variant="secondary" className="ml-auto text-xs">
            Soon
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Business
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                business "{business.name}" and remove all associated data from
                our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={deleteBusinessMutation.isPending}
              >
                {deleteBusinessMutation.isPending
                  ? 'Deleting...'
                  : 'Delete Business'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function BusinessesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch businesses with current filters
  const { data, isLoading, error } = useUserBusinesses({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const businesses = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">My Businesses</h1>
          <p className="text-muted-foreground mt-2">
            Manage your business places on Placia.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Failed to load businesses. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">My Businesses</h1>
          <p className="text-muted-foreground mt-2">
            Manage your business places on Placia.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/add-business')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Business
        </Button>
      </div>

      {/* Filters and Content */}
      <Card>
        <CardHeader>
          <CardTitle>Businesses ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="scraped">Scraped</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-[80px]" />
                      <Skeleton className="h-6 w-[70px]" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-16">
              <Building2 className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {search || (statusFilter && statusFilter !== 'all')
                    ? 'No matching businesses found'
                    : 'No businesses found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {search || (statusFilter && statusFilter !== 'all')
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by adding your first business.'}
                </p>
                {!search && (!statusFilter || statusFilter === 'all') && (
                  <Button
                    onClick={() => router.push('/dashboard/add-business')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Business
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Business Cards */}
              <div className="space-y-4">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {business.main_image || business.logo ? (
                        <SafeImage
                          src={business.main_image || business.logo || ''}
                          alt={business.name}
                          width={64}
                          height={64}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg truncate">
                            {business.name}
                          </h3>
                          {business.tagline && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {business.tagline}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-3">
                            <Badge variant="outline">
                              {business.category.name}
                            </Badge>
                            {business.subcategory && (
                              <Badge variant="secondary" className="text-xs">
                                {business.subcategory.name}
                              </Badge>
                            )}
                            <StatusBadge status={business.status} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Created{' '}
                            {new Date(business.created_at).toLocaleDateString()}
                            {business.city && ` • ${business.city.name}`}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4">
                          <ActionsDropdown business={business} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, totalCount)} of {totalCount}{' '}
                    businesses
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
