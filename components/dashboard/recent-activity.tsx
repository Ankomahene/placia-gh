'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const activities = [
  {
    id: '1',
    user: {
      name: 'John Doe',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    },
    action: 'reviewed',
    place: 'Buka Restaurant',
    time: '2 hours ago',
  },
  {
    id: '2',
    user: {
      name: 'Jane Smith',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    },
    action: 'added photos to',
    place: 'Labadi Beach Hotel',
    time: '4 hours ago',
  },
  {
    id: '3',
    user: {
      name: 'Mike Johnson',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    },
    action: 'favorited',
    place: 'Accra Mall',
    time: '6 hours ago',
  },
  {
    id: '4',
    user: {
      name: 'Sarah Wilson',
      image: 'https://images.pexels.com/photos/3775534/pexels-photo-3775534.jpeg',
    },
    action: 'commented on',
    place: 'Kwame Nkrumah Memorial Park',
    time: '8 hours ago',
  },
];

export function RecentActivity() {
  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-4 rounded-lg border p-3"
          >
            <Avatar>
              <AvatarImage src={activity.user.image} alt={activity.user.name} />
              <AvatarFallback>
                {activity.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>{' '}
                {activity.action}{' '}
                <span className="font-medium">{activity.place}</span>
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}