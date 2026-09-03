import { useState } from 'react';
import { CalendarCheck, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Clock, Zap, Lightbulb, Calendar } from 'lucide-react';
import { createTaskPlan, type TaskInput, type TaskPlan } from '@/lib/aiEngine';
import { LoadingSpinner, ButtonSpinner } from '@/components/LoadingSpinner';

const priorities = ['High', 'Medium', 'Low'];

const priorityColors: Record<string, string> = {
  High: 'bg-error-50 text-error-700 border-error-200',
  Medium: 'bg-warning-50 text-warning-700 border-warning-200',
  Low: 'bg-success-50 text-success-700 border-success-200',
};

const priorityDots: Record<string, string> = {
  High: 'bg-error-500',
  Medium: 'bg-warning-500',
  Low: 'bg-success-500',
};

export function TaskPlanner() {
  const [tasks, setTasks] = useState<TaskInput[]>([
    { id: '1', name: '', deadline: '', priority: 'Medium', estimatedTime: '' },
  ]);
  const [result, setResult] = useState<TaskPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTask = () => {
    setTasks([...tasks, { id: `${Date.now()}`, name: '', deadline: '', priority: 'Medium', estimatedTime: '' }]);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const updateTask = (id: string, field: keyof TaskInput, value: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleCreatePlan = async () => {
    setError('');
    setResult(null);

    const validTasks = tasks.filter((t) => t.name.trim());
    if (validTasks.length === 0) {
      setError('Please add at least one task with a name before creating a plan.');
      return;
    }

    setLoading(true);
    try {
      const plan = await createTaskPlan(tasks);
      if (plan.clarificationNeeded) {
        setError(plan.clarificationNeeded);
      } else {
        setResult(plan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while creating your plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTasks([{ id: '1', name: '', deadline: '', priority: 'Medium', estimatedTime: '' }]);
    setResult(null);
    setError('');
  };

  const handleRegenerate = () => {
    if (tasks.some((t) => t.name.trim())) {
      handleCreatePlan();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50">
            <CalendarCheck className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Your Tasks</h3>
            <p className="text-sm text-gray-500">Add tasks you need to complete</p>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 animate-slide-in"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Task {index + 1}</span>
                {tasks.length > 1 && (
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-gray-400 hover:text-error-500 transition-colors"
                    aria-label="Remove task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={task.name}
                  onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                  placeholder="Task name (e.g., Finish quarterly report)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-success-500 focus:ring-2 focus:ring-success-100 outline-none transition-all"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                    <input
                      type="date"
                      value={task.deadline}
                      onChange={(e) => updateTask(task.id, 'deadline', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-success-500 focus:ring-2 focus:ring-success-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-success-500 focus:ring-2 focus:ring-success-100 outline-none transition-all bg-white"
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estimated Time</label>
                  <input
                    type="text"
                    value={task.estimatedTime}
                    onChange={(e) => updateTask(task.id, 'estimatedTime', e.target.value)}
                    placeholder="e.g., 2 hours, 30 minutes, 1 day"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-success-500 focus:ring-2 focus:ring-success-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addTask}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 hover:border-success-400 hover:text-success-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Another Task
          </button>

          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 px-4 py-3 animate-slide-up">
              <AlertTriangle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreatePlan}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-success-600 px-5 py-3 text-sm font-semibold text-white hover:bg-success-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <ButtonSpinner />
                  Creating Plan...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create My Plan
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 lg:sticky lg:top-24 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
              <CheckCircle2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Today's Priorities</h3>
              <p className="text-sm text-gray-500">AI-organized task plan</p>
            </div>
          </div>
          {result && (
            <button
              onClick={handleRegenerate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          )}
        </div>

        {loading && <LoadingSpinner label="AI is organizing your tasks..." />}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <CalendarCheck className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Your task plan will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Add your tasks and click "Create My Plan"</p>
          </div>
        )}

        {!loading && result && (
          <div className="animate-slide-up space-y-6">
            {/* Priority Sections */}
            <PrioritySection
              title="High Priority"
              subtitle="Tasks that need immediate attention"
              tasks={result.highPriority}
              dotColor={priorityDots.High}
              badgeColor={priorityColors.High}
            />
            <PrioritySection
              title="Medium Priority"
              subtitle="Tasks that should be completed soon"
              tasks={result.mediumPriority}
              dotColor={priorityDots.Medium}
              badgeColor={priorityColors.Medium}
            />
            <PrioritySection
              title="Low Priority"
              subtitle="Tasks that can be completed later"
              tasks={result.lowPriority}
              dotColor={priorityDots.Low}
              badgeColor={priorityColors.Low}
            />

            {/* Daily Schedule */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                  <Calendar className="h-4 w-4 text-primary-600" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Daily Schedule</h4>
              </div>
              <div className="ml-10 space-y-2">
                {result.schedule.map((block, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 w-36 flex-shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {block.time}
                    </div>
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${priorityDots[block.priority] || 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-700 flex-1">{block.taskName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Productivity Tips */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50">
                  <Lightbulb className="h-4 w-4 text-warning-600" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Productivity Tips</h4>
              </div>
              <div className="ml-10 space-y-2">
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-lg bg-warning-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-warning-500 flex-shrink-0" />
              <p className="text-xs text-warning-700 font-medium">
                AI-generated content should be reviewed by a human before professional use.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrioritySection({
  title,
  subtitle,
  tasks,
  dotColor,
  badgeColor,
}: {
  title: string;
  subtitle: string;
  tasks: TaskInput[];
  dotColor: string;
  badgeColor: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-3 w-3 rounded-full ${dotColor}`} />
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      </div>
      <p className="text-xs text-gray-400 ml-5 mb-2">{subtitle}</p>
      <div className="ml-5 space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 italic px-3 py-2">No tasks in this category.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{task.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {task.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.deadline}
                    </span>
                  )}
                  {task.estimatedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.estimatedTime}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-semibold rounded-full border px-2.5 py-0.5 ${badgeColor}`}>
                {task.priority}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
