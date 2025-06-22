export const mockContacts = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    lastMessage: 'Hey! How are you doing?',
    time: '2:30 PM',
    unread: 2,
    online: true,
    lastSeen: '2 min ago'
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    lastMessage: 'The meeting is scheduled for tomorrow',
    time: '1:45 PM',
    unread: 0,
    online: false,
    lastSeen: '1 hour ago'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    lastMessage: 'Thanks for the help!',
    time: '12:30 PM',
    unread: 0,
    online: true,
    lastSeen: 'just now'
  },
  {
    id: '4',
    name: 'David Wilson',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    lastMessage: 'Can we reschedule?',
    time: '11:15 AM',
    unread: 1,
    online: false,
    lastSeen: '3 hours ago'
  },
  {
    id: '5',
    name: 'Lisa Park',
    avatar: 'https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    lastMessage: 'Great work on the project!',
    time: '10:20 AM',
    unread: 0,
    online: true,
    lastSeen: '5 min ago'
  }
];

export const mockMessages = {
  '1': [
    {
      id: '1',
      text: 'Hey! How are you doing?',
      timestamp: '2:25 PM',
      sent: false,
      delivered: true,
      read: true
    },
    {
      id: '2',
      text: 'I\'m doing great! Just finished a big project at work.',
      timestamp: '2:27 PM',
      sent: true,
      delivered: true,
      read: true
    },
    {
      id: '3',
      text: 'That\'s awesome! What kind of project was it?',
      timestamp: '2:28 PM',
      sent: false,
      delivered: true,
      read: true
    },
    {
      id: '4',
      text: 'It was a new chat messenger app with a really clean design. I\'m pretty proud of how it turned out!',
      timestamp: '2:30 PM',
      sent: true,
      delivered: true,
      read: false,
      reactions: ['👏', '🔥']
    }
  ],
  '2': [
    {
      id: '5',
      text: 'The meeting is scheduled for tomorrow',
      timestamp: '1:45 PM',
      sent: false,
      delivered: true,
      read: true
    },
    {
      id: '6',
      text: 'Perfect! What time should I be there?',
      timestamp: '1:46 PM',
      sent: true,
      delivered: true,
      read: true
    }
  ],
  '3': [
    {
      id: '7',
      text: 'Thanks for the help!',
      timestamp: '12:30 PM',
      sent: false,
      delivered: true,
      read: true
    },
    {
      id: '8',
      text: 'You\'re welcome! Anytime you need help, just let me know.',
      timestamp: '12:32 PM',
      sent: true,
      delivered: true,
      read: true
    }
  ],
  '4': [
    {
      id: '9',
      text: 'Can we reschedule?',
      timestamp: '11:15 AM',
      sent: false,
      delivered: true,
      read: true
    }
  ],
  '5': [
    {
      id: '10',
      text: 'Great work on the project!',
      timestamp: '10:20 AM',
      sent: false,
      delivered: true,
      read: true
    },
    {
      id: '11',
      text: 'Thank you! I really appreciate the feedback.',
      timestamp: '10:22 AM',
      sent: true,
      delivered: true,
      read: true
    }
  ]
};