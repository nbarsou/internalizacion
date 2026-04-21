import { dbGetContactsByUniversity } from '@/features/contacts/db';
import { ContactsTableClient } from './contacts-table-client';

interface ContactsTableProps {
  universityId: string;
  universityName: string;
}

export async function ContactsTable({
  universityId,
  universityName,
}: ContactsTableProps) {
  const contacts = await dbGetContactsByUniversity(universityId);

  return (
    <ContactsTableClient
      universityId={universityId}
      universityName={universityName}
      initialContacts={contacts}
    />
  );
}
