import { DatabaseAccess } from '../dataaccess';

///////////////////////////////////////////////////////////////////////
// 部署関連
///////////////////////////////////////////////////////////////////////

export async function addDepartment(this: DatabaseAccess, name: string) {
  await this.knex('department').insert({ name: name });
}

export async function getDepartments(this: DatabaseAccess) {
  return await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('department');
}

export async function addSection(this: DatabaseAccess, departmentName: string, sectionName: string) {
  const result = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' })
    .from('department')
    .where('name', departmentName)
    .first();

  await this.knex('department').insert({ name: sectionName, department: result?.id });
}

export async function getSections(this: DatabaseAccess) {
  return await this.knex.select<{ id: number, sectionName: string, departmentName: string }[]>({
    id: 'section.id', sectionName: 'section.name', departmentName: 'department.name'
  })
    .from('section')
    .leftJoin('department', { 'department.id': 'section.department' });
}
