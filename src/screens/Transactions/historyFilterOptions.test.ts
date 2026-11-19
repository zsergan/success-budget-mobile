import { assigneeOptions } from './historyFilterOptions';

describe('assigneeOptions', () => {
  it('offers all, the user, members, the two special values, then former and deleted members', () => {
    const options = assigneeOptions(
      {
        members: [
          { key: 'member:31', userId: 31, name: 'Lena', status: 'member' },
          { key: 'member:7', userId: 7, name: 'Zakhar', status: 'member' },
        ],
        formerMembers: [{ key: 'member:40', userId: 40, name: 'Mark', status: 'former_member' }],
        hasDeletedMembers: true,
      },
      7,
    );

    expect(options.map(({ label, value }) => [label, value])).toEqual([
      ['All transactions', undefined],
      ['You', 'member:7'],
      ['Lena', 'member:31'],
      ['Whole space', 'space'],
      ['No member assigned', 'unassigned'],
      ['Mark · Former member', 'member:40'],
      ['Deleted member', 'deleted_member'],
    ]);
    expect(options[5].section).toBe('Former members');
  });

  it('keeps the whole space and nobody on offer before the list loads', () => {
    expect(assigneeOptions(undefined, 7).map(({ key }) => key)).toEqual(['all', 'space', 'unassigned']);
  });
});
