const fs = require('fs');

const eventFormPath = 'src/components/EventForm/EventForm.tsx';
let content = fs.readFileSync(eventFormPath, 'utf8');

// Add Controller import
if (!content.includes('Controller')) {
  content = content.replace(
    "import { useForm } from 'react-hook-form';",
    "import { useForm, Controller } from 'react-hook-form';",
  );
}

// Add SelectDropdown import
content = "import SelectDropdown from 'components/common/SelectDropdown';\n" + content;

// Replace Type Select
content = content.replace(
  /<select[\s\S]*?\{...register\('type'[\s\S]*?<\/select>/,
  `<Controller
              name="type"
              control={control}
              rules={{ required: EventFormStrings.ERR_TYPE_REQUIRED }}
              render={({ field }) => (
                <SelectDropdown
                  {...field}
                  options={Object.values(EventType).map(type => ({ value: type, label: type }))}
                  placeholder={EventFormStrings.PLACEHOLDER_SELECT_TYPE}
                  error={errors.type?.message}
                />
              )}
            />`,
);

// Replace Priority Select
content = content.replace(
  /<select[\s\S]*?\{...register\('priority'[\s\S]*?<\/select>/,
  `<Controller
              name="priority"
              control={control}
              rules={{ required: EventFormStrings.ERR_PRIORITY_REQUIRED }}
              render={({ field }) => (
                <SelectDropdown
                  {...field}
                  options={Object.values(EventPriority).map(priority => ({ value: priority, label: priority }))}
                  placeholder={EventFormStrings.PLACEHOLDER_SELECT_PRIORITY}
                  error={errors.priority?.message}
                />
              )}
            />`,
);

// Replace Departments Select (multi)
content = content.replace(
  /<select[\s\S]*?\{...register\('departments'[\s\S]*?<\/select>/,
  `<Controller
              name="departments"
              control={control}
              rules={{ required: EventFormStrings.ERR_DEPARTMENTS_REQUIRED }}
              render={({ field }) => (
                <SelectDropdown
                  {...field}
                  isMulti
                  options={departments.map(dept => ({ value: dept.id || dept._id || '', label: dept.name }))}
                  placeholder={EventFormStrings.LABEL_DEPARTMENTS}
                  error={errors.departments?.message}
                />
              )}
            />`,
);

// Add control extraction
content = content.replace(
  'const { register, handleSubmit, formState: { errors } } = useForm',
  'const { register, control, handleSubmit, formState: { errors } } = useForm',
);

// Remove any type inside
content = content.replace(
  'const departmentsList = departmentsResponse as any;',
  'const departmentsList = departmentsResponse as { data?: DepartmentOption[] } | DepartmentOption[];',
);

fs.writeFileSync(eventFormPath, content);
console.log('EventForm refactored');
