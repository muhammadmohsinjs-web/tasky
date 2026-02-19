import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Circle,
  FileText,
  Filter,
  FolderKanban,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  ServerCog,
  SquareCode,
  Users,
} from 'lucide-react';

type TaskStatus = 'In Progress' | 'Completed' | 'Pending' | 'Due Today';
type TaskCategory =
  | 'Development'
  | 'Docs'
  | 'Project Planning'
  | 'Design'
  | 'DevOps'
  | 'Client Review';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  datePrimary: string;
  dateSecondary: string;
  category: TaskCategory;
  showMenu?: boolean;
  showFeTag?: boolean;
}

const tasks: Task[] = [
  {
    id: 1,
    title: 'Fix Login Bug',
    status: 'In Progress',
    datePrimary: 'May 25',
    dateSecondary: 'May 25',
    category: 'Development',
    showMenu: true,
    showFeTag: true,
  },
  {
    id: 2,
    title: 'Update Documentation',
    status: 'Completed',
    datePrimary: 'May 23',
    dateSecondary: 'May 23',
    category: 'Docs',
  },
  {
    id: 3,
    title: 'Plan Sprint Meeting',
    status: 'Pending',
    datePrimary: 'May 26',
    dateSecondary: 'May 26',
    category: 'Project Planning',
  },
  {
    id: 4,
    title: 'Review Design Mockups',
    status: 'Completed',
    datePrimary: 'May 20',
    dateSecondary: 'May 20',
    category: 'Design',
  },
  {
    id: 5,
    title: 'Set Up CI/CD Pipeline',
    status: 'In Progress',
    datePrimary: 'May 27',
    dateSecondary: 'May 27',
    category: 'DevOps',
  },
  {
    id: 6,
    title: 'Client Feedback Review',
    status: 'Due Today',
    datePrimary: 'Today',
    dateSecondary: 'May 28',
    category: 'Client Review',
  },
  {
    id: 7,
    title: 'Code Refactoring',
    status: 'Pending',
    datePrimary: 'May 28',
    dateSecondary: 'May 28',
    category: 'Development',
    showMenu: true,
  },
];

const statusConfig: Record<
  TaskStatus,
  {
    badgeClass: string;
    badgeTextClass: string;
    indicator: ReactNode;
  }
> = {
  'In Progress': {
    badgeClass: 'bg-[#E25E4F]',
    badgeTextClass: 'text-white',
    indicator: <Circle className="h-[33px] w-[33px] text-[#E44B3E]" strokeWidth={2.2} />,
  },
  Completed: {
    badgeClass: 'bg-[#43B175]',
    badgeTextClass: 'text-white',
    indicator: <CheckCircle2 className="h-[33px] w-[33px] fill-[#43B175] text-white" strokeWidth={2.3} />,
  },
  Pending: {
    badgeClass: 'bg-[#F0CF68]',
    badgeTextClass: 'text-[#27384A]',
    indicator: <Circle className="h-[33px] w-[33px] text-[#E6AC27]" strokeWidth={2.2} />,
  },
  'Due Today': {
    badgeClass: 'bg-[#F0CF68]',
    badgeTextClass: 'text-[#27384A]',
    indicator: (
      <div className="relative">
        <Circle className="h-[33px] w-[33px] text-[#E6AC27]" strokeWidth={2.2} />
        <div className="absolute left-1/2 top-1/2 h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E6AC27]" />
      </div>
    ),
  },
};

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex h-[38px] min-w-[145px] items-center justify-center rounded-[10px] px-4 text-[36px] font-semibold leading-none tracking-[-0.01em] ${config.badgeClass} ${config.badgeTextClass}`}
    >
      {status}
    </span>
  );
}

function CategoryPill({ category, showFeTag }: { category: TaskCategory; showFeTag?: boolean }) {
  const icon =
    category === 'Development' ? (
      <SquareCode className="h-[14px] w-[14px] text-[#5C6E95]" strokeWidth={2.1} />
    ) : category === 'Docs' ? (
      <FileText className="h-[14px] w-[14px] text-[#5C6E95]" strokeWidth={2.1} />
    ) : category === 'Project Planning' ? (
      <FolderKanban className="h-[14px] w-[14px] text-[#5C6E95]" strokeWidth={2.1} />
    ) : category === 'Design' ? (
      <Palette className="h-[14px] w-[14px] text-[#5C6E95]" strokeWidth={2.1} />
    ) : category === 'DevOps' ? (
      <ServerCog className="h-[14px] w-[14px] text-[#5C6E95]" strokeWidth={2.1} />
    ) : (
      <Users className="h-[14px] w-[14px] text-[#5C6E95]" strokeWidth={2.1} />
    );

  return (
    <div className="flex items-center gap-3">
      {showFeTag ? (
        <span className="inline-flex h-[30px] items-center rounded-full bg-[#E8EEF8] px-[9px] text-[26px] font-semibold leading-none tracking-[-0.01em] text-[#50689A]">
          FE
        </span>
      ) : null}
      <span className="inline-flex h-[27px] w-[27px] items-center justify-center rounded-[8px] bg-[#E9EEF6]">
        {icon}
      </span>
      <span className="text-[39px] leading-none text-[#5E6A7A]">{category}</span>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const config = statusConfig[task.status];

  return (
    <div className="group flex min-h-[132px] items-center justify-between rounded-[34px] border border-[#E6EAF1] bg-white px-8 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_16px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:bg-[#FCFDFF]">
      <div className="flex min-w-0 items-center gap-5">
        <span className="shrink-0">{config.indicator}</span>
        <div className="min-w-0">
          <p className="truncate text-[51px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#131D32]">
            {task.title}
          </p>
          <div className="mt-4">
            <CategoryPill category={task.category} showFeTag={task.showFeTag} />
          </div>
        </div>
      </div>

      <div className="ml-5 flex shrink-0 items-center gap-[18px]">
        <StatusBadge status={task.status} />
        <div className="min-w-[98px] text-right">
          <p className="text-[46px] leading-[1.08] tracking-[-0.01em] text-[#3A4558]">{task.datePrimary}</p>
          <p className="mt-[9px] text-[46px] leading-[1.08] tracking-[-0.01em] text-[#58647A]">{task.dateSecondary}</p>
        </div>
        <div className="flex w-8 justify-end">
          {task.showMenu ? (
            <button
              type="button"
              className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#56647F] transition-colors hover:bg-[#EEF2F8]"
              aria-label="Task options"
            >
              <MoreHorizontal className="h-[19px] w-[19px]" strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="flex h-[76px] items-center overflow-hidden rounded-[18px] border border-[#D7DEE8] bg-[#F6F8FC]">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-6">
        <Search className="h-[31px] w-[31px] text-[#6B788F]" strokeWidth={2.1} />
        <span className="truncate text-[44px] leading-none tracking-[-0.01em] text-[#6C788F]">Search tasks...</span>
      </div>
      <button
        type="button"
        className="inline-flex h-full w-[90px] items-center justify-center border-l border-[#D7DEE8] text-[#6B788F] transition-colors hover:bg-[#EEF3FA]"
        aria-label="Filter tasks"
      >
        <Filter className="h-[31px] w-[31px]" strokeWidth={2.1} />
      </button>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-8 py-7">
      <h2 className="text-[56px] font-semibold leading-none tracking-[-0.02em] text-[#111B31]">Tasks</h2>
      <button
        type="button"
        className="mr-3 inline-flex h-[74px] items-center gap-3 rounded-[11px] bg-[#3A80F2] px-8 text-[44px] font-medium leading-none tracking-[-0.01em] text-white shadow-[0_2px_6px_rgba(44,109,221,0.45)] transition-colors duration-150 hover:bg-[#3378EA]"
      >
        <Plus className="h-[31px] w-[31px]" strokeWidth={2.4} />
        Add Task
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-t border-[#E4E9F0] px-8 pb-16 pt-10">
      <div className="flex flex-col items-center text-center">
        <svg width="182" height="150" viewBox="0 0 182 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="91" cy="134" rx="72" ry="14" fill="#E8EDF6" />
          <rect x="47" y="24" width="88" height="104" rx="8" fill="#EFF3FA" stroke="#8EA0B8" strokeWidth="5" />
          <rect x="76" y="12" width="30" height="24" rx="12" fill="#EFF3FA" stroke="#7E94AF" strokeWidth="5" />
          <circle cx="73" cy="65" r="6" fill="#5D708A" />
          <circle cx="108" cy="65" r="6" fill="#5D708A" />
          <path d="M70 88C79 96 100 96 109 88" stroke="#5D708A" strokeWidth="5" strokeLinecap="round" />
          <circle cx="136" cy="108" r="24" fill="#7388A4" stroke="#EFF3FA" strokeWidth="5" />
          <path d="M125 108L134 117L149 100" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="mt-6 text-[56px] font-semibold leading-none tracking-[-0.02em] text-[#1D2A44]">No tasks found.</h3>
        <p className="mt-5 text-[52px] leading-none tracking-[-0.02em] text-[#4C5D77]">You&apos;re all caught up!</p>
      </div>
    </div>
  );
}

export default function TasksPanel() {
  return (
    <section className="w-full max-w-[780px] rounded-[14px] border border-[#D3DAE5] bg-[#F4F6FA] shadow-[0_6px_20px_rgba(15,23,42,0.09)]">
      <TopBar />

      <div className="border-y border-[#DFE4ED] px-8 py-5">
        <SearchBar />
      </div>

      <div className="space-y-5 px-6 py-5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>

      <EmptyState />
    </section>
  );
}

export { CategoryPill, EmptyState, SearchBar, StatusBadge, TaskRow, tasks, TopBar };
