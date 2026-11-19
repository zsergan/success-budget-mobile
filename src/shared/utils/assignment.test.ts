import type { AssignmentModel, PersonModel } from '@api/models';
import { assignmentLabel, authorLabel, isOwnAssignment, personLabel } from './assignment';

const person = (overrides: Partial<PersonModel> = {}): PersonModel => ({
  userId: 31,
  name: 'Lena',
  status: 'member',
  ...overrides,
});

describe('assignment labels', () => {
  it('names a member, the signed-in user as You, a former member and a deleted account', () => {
    expect(personLabel(person(), 7)).toBe('Lena');
    expect(personLabel(person({ userId: 7, name: 'Zakhar' }), 7)).toBe('You');
    expect(personLabel(person({ status: 'former_member' }), 7)).toBe('Lena · Former member');
    expect(personLabel(person({ userId: null, name: null, status: 'deleted' }), 7)).toBe('Deleted member');
  });

  it('keeps the whole space, nobody and a deleted member apart', () => {
    const deleted: AssignmentModel = {
      kind: 'member',
      person: person({ userId: null, name: null, status: 'deleted' }),
    };

    expect(assignmentLabel({ kind: 'space' }, 7)).toBe('Whole space');
    expect(assignmentLabel({ kind: 'unassigned' }, 7)).toBe('No member assigned');
    expect(assignmentLabel(deleted, 7)).toBe('Deleted member');
  });

  it('never presents an imported author as the person who entered the record', () => {
    expect(authorLabel({ ...person({ userId: 7, name: 'Zakhar' }), source: 'imported' }, 7)).toBe(
      'Imported from wallet history',
    );
    expect(authorLabel({ ...person(), source: 'recorded' }, 7)).toBe('Lena');
  });

  it('treats only the signed-in user, still a member, as the ordinary own assignment', () => {
    expect(isOwnAssignment({ kind: 'member', person: person({ userId: 7 }) }, 7)).toBe(true);
    expect(isOwnAssignment({ kind: 'member', person: person({ userId: 7, status: 'former_member' }) }, 7)).toBe(false);
    expect(isOwnAssignment({ kind: 'space' }, 7)).toBe(false);
    expect(isOwnAssignment({ kind: 'member', person: person() }, 7)).toBe(false);
  });
});
