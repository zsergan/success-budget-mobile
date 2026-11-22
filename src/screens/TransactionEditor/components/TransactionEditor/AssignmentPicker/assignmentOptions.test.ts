import type { SpaceMember } from '@api/dto';
import { buildAssignmentOptions, visibleOptions } from './assignmentOptions';

const member = (userId: number, name: string | null, email = `${name ?? 'user'}@example.com`): SpaceMember => ({
  type: 'member',
  id: userId + 100,
  user_id: userId,
  name,
  email,
  role: 'member',
  can_remove: true,
});
const invite: SpaceMember = {
  type: 'invite',
  id: 9,
  user_id: null,
  name: null,
  role: null,
  email: 'anna@example.com',
  can_remove: true,
};
const self = { id: 7, name: 'Zakhar' };
const labels = (options: ReturnType<typeof buildAssignmentOptions>) => options.map(({ label }) => label);

describe('buildAssignmentOptions', () => {
  it('lists the whole space, the user, the other members, then nobody, never an invitation', () => {
    const options = buildAssignmentOptions({
      members: [member(31, 'Lena'), member(7, 'Zakhar'), invite, member(40, 'Mark')],
      self,
      saved: null,
    });

    expect(labels(options)).toEqual(['Whole space', 'You', 'Lena', 'Mark', 'No member assigned']);
    expect(options[0].value).toEqual({ kind: 'space' });
    expect(options[1].value).toEqual({ kind: 'member', userId: 7 });
  });

  it('offers the user alone, with the special values, until the members load', () => {
    expect(labels(buildAssignmentOptions({ members: undefined, self, saved: null }))).toEqual([
      'Whole space',
      'You',
      'No member assigned',
    ]);
  });

  it('keeps the whole space first with only the user in the space', () => {
    expect(labels(buildAssignmentOptions({ members: [member(7, 'Zakhar')], self, saved: null }))).toEqual([
      'Whole space',
      'You',
      'No member assigned',
    ]);
  });

  it('tells people of one name apart by their email', () => {
    const options = buildAssignmentOptions({
      members: [member(7, 'Zakhar'), member(31, 'Lena', 'lena@home.com'), member(32, 'lena', 'lena@work.com')],
      self,
      saved: null,
    });

    expect(options.slice(2, 4).map(({ detail, fullName }) => [detail, fullName])).toEqual([
      ['lena@home.com', 'Lena · lena@home.com'],
      ['lena@work.com', 'lena · lena@work.com'],
    ]);
  });

  it("keeps the record's person who left, or a deleted account, after the members and marked", () => {
    const former = buildAssignmentOptions({
      members: [member(7, 'Zakhar')],
      self,
      saved: { kind: 'member', person: { userId: 40, name: 'Mark', status: 'former_member' } },
    });
    const deleted = buildAssignmentOptions({
      members: [member(7, 'Zakhar')],
      self,
      saved: { kind: 'member', person: { userId: null, name: null, status: 'deleted' } },
    });

    expect(former[2]).toMatchObject({ label: 'Mark', detail: 'Former member', isGone: true, value: { userId: 40 } });
    expect(deleted[2]).toMatchObject({
      label: 'Deleted member',
      isGone: true,
      value: { kind: 'member', userId: null },
    });
    expect(labels(former)).toEqual(['Whole space', 'You', 'Mark', 'No member assigned']);
    expect(labels(deleted)).toEqual(['Whole space', 'You', 'Deleted member', 'No member assigned']);
  });

  it("keeps the record's member while the members load, without marking them gone", () => {
    const options = buildAssignmentOptions({
      members: undefined,
      self,
      saved: { kind: 'member', person: { userId: 31, name: 'Lena', status: 'member' } },
    });

    expect(labels(options)).toEqual(['Whole space', 'You', 'Lena', 'No member assigned']);
    expect(options[2]).toMatchObject({ label: 'Lena', isGone: false });
  });
});

describe('visibleOptions', () => {
  const many = buildAssignmentOptions({
    members: [7, 31, 32, 33, 34, 35, 36, 37].map((id) => member(id, id === 7 ? 'Zakhar' : `Member ${id}`)),
    self,
    saved: null,
  });

  it('shows the whole space, the first people, the picked one and nobody, with the rest behind More', () => {
    const { shown, hidden, moreAt } = visibleOptions(many, { kind: 'member', userId: 37 }, false);

    expect(labels(shown)).toEqual([
      'Whole space',
      'You',
      'Member 31',
      'Member 32',
      'Member 33',
      'Member 34',
      'Member 37',
      'No member assigned',
    ]);
    expect(hidden).toBe(2);
    expect(labels(shown.slice(moreAt))).toEqual(['No member assigned']);
  });

  it('keeps the whole space first when expanded, with every person before nobody', () => {
    const { shown, hidden, moreAt } = visibleOptions(many, { kind: 'space' }, true);

    expect(shown).toBe(many);
    expect(labels(shown)[0]).toBe('Whole space');
    expect(hidden).toBe(0);
    expect(moreAt).toBe(many.length - 1);
  });

  it('keeps a picked former member shown after the first people when collapsed', () => {
    const options = buildAssignmentOptions({
      members: [7, 31, 32, 33, 34, 35, 36].map((id) => member(id, id === 7 ? 'Zakhar' : `Member ${id}`)),
      self,
      saved: { kind: 'member', person: { userId: 40, name: 'Mark', status: 'former_member' } },
    });

    const { shown, hidden } = visibleOptions(options, { kind: 'member', userId: 40 }, false);

    expect(labels(shown)).toEqual([
      'Whole space',
      'You',
      'Member 31',
      'Member 32',
      'Member 33',
      'Member 34',
      'Mark',
      'No member assigned',
    ]);
    expect(hidden).toBe(2);
  });
});
