import dynamic from 'next/dynamic';

const PlaceSchemaClient = dynamic(() => import('./PlaceSchemaClient'));

export default function PlaceSchemaPage() {
  return <PlaceSchemaClient />;
}
