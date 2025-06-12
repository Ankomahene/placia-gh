import { useLocation } from '@/hooks/use-location';
import { createContext, useState } from 'react';

interface ISearchContext {
  searchTerm: string;
  setSearchTerm: (query: string) => void;
  onSearch: (query: string) => void;
  isOpenSearchWindow: boolean;
  setIsOpenSearchWindow: (isOpen: boolean) => void;
  userLocation: { lat: number; lng: number };
}

export const SearchContext = createContext<ISearchContext | null>(null);

export const SearchContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpenSearchWindow, setIsOpenSearchWindow] = useState(false);
  const location = useLocation();
  const userLocation = {
    lat: location.latitude as number,
    lng: location.longitude as number,
  };

  const onSearch = (query: string) => {
    console.log('searching for', query);
    if (!isOpenSearchWindow) {
      setIsOpenSearchWindow(true);
    }
  };

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        isOpenSearchWindow,
        userLocation,
        setSearchTerm,
        onSearch,
        setIsOpenSearchWindow,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
