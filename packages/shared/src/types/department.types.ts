export interface Department {
    id: string;
    name: string;
    description: string;
    admins: string[]; // array of user IDs
    subDepartments?: string[]; // array of department IDs
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDepartmentDto {
    name: string;
    description: string;
    admins?: string[];
    subDepartments?: string[];
}

export interface UpdateDepartmentDto {
    name?: string;
    description?: string;
    admins?: string[];
    subDepartments?: string[];
}
