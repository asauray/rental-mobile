import React, { useCallback, useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { Input } from "@/components/ui/input";
import { H4, P } from "@/components/ui/typography";
import { Text } from "@/components/ui/text";
import { useUserContext } from "./hooks/UserContextProvider";
import { useTenantContext } from "./hooks/TenantContextProvider";
import auth from "@react-native-firebase/auth";
import { RentalApi, SearchResultDto, SearchResultsResponse } from "./api/rental_api";
import dayjs from "dayjs";
import { StatusBadge } from "./components/StatusBadge";
import { router } from "expo-router";
import { debounce } from "lodash";
import Badge from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SearchResponse {
    next: string;
    previous: string;
    results: SearchResult[];
}
export interface SearchResult {
    id: number;
    state: string;
    stateUpdatedAt: dayjs.Dayjs;
    model: string;
    unitId: number;
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
    priceAmountMinor: number;
    currency: string;
    formattedPrice: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhoneNumber: string;
    createdAt: string;
}

export default function ReservationSearch() {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<SearchResponse| undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useUserContext();
  const { tenant } = useTenantContext();

  const signOut = async () => {
    await auth().signOut();
  };

  // Create a stable debounced function
  const debouncedSearch = useCallback(
    debounce(async (query: string, page: string | undefined, stateFilter: string | undefined, user: any, tenant: any) => {
      if (!user || !tenant) {
        setLoading(false);
        setError("Utilisateur non authentifié");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] API CALL - Query: "${query}", Page: "${page}", StateFilter: "${stateFilter}"`);
        const data = await RentalApi.fetchSearch(query, page, stateFilter ? [stateFilter] : undefined, tenant, user, signOut);
        if(page) {
          console.log('new page: token=' + page)
          setResults(currentResults => {
            const newResults = [...currentResults?.results ?? [], ...mapSearchResult(data).results];
            return {
              results: newResults,
              next: data.pagination.next,
              previous: data.pagination.previous,
            };
          });
        } else {
          setResults(mapSearchResult(data));
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError("Erreur lors de la recherche");
      }
    }, 500),
    [] // Empty dependency array to keep debounce stable
  );

  const fetchResults = useCallback((query: string, page: string | undefined, stateFilter: string | undefined) => {
    debouncedSearch(query, page, stateFilter, user, tenant);
  }, [debouncedSearch, user, tenant]);

  const onChangeText = useCallback((text: string) => {
    setQuery(text);
    setResults(undefined);
    fetchResults(text, undefined, stateFilter);
  }, [fetchResults, stateFilter]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 4 }}>
      <Input
        placeholder="Rechercher par nom, email ou téléphone"
        value={query}
        onChangeText={onChangeText}
        autoFocus
      />
      <View className="flex-row gap-2">
        <Select defaultValue={{value: "any", label: "Tout"}} onValueChange={(value) => {
            const newFilter = value?.value === "any" ? undefined : value?.value;
            setStateFilter(newFilter);
            setResults(undefined); // Clear results when filter changes
            fetchResults(query, undefined, newFilter);
        }}>
        <SelectTrigger>
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any" label="Tout"/>
          <SelectItem value="pending_capture" label="En attente"/>
          <SelectItem value="confirmed" label="Confirmé"/>
          <SelectItem value="cancelled" label="Annulé"/>
          <SelectItem value="failed" label="Échoué"/>
          <SelectItem value="expired" label="Expiré"/>
        </SelectContent>
      </Select>
      </View>
      
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {error && <Text style={{ color: "red", marginTop: 16 }}>{error}</Text>}
      <FlatList
        data={results?.results}
        keyExtractor={(item) => String(item.id)}
        onEndReached={() => {
            if (results?.next) {
              fetchResults(query, results.next, stateFilter);
            }
        }}
        renderItem={({ item }) => (
            <TouchableOpacity onPress={() => {
                router.push({
                    pathname: "/routes/rental-details",
                    params: { rentalId: item.id },
                });
            }}>
          <View
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderColor: "#eee",
            }}
          >
            <View>
            <H4>{item.model}</H4>
            <H4>
              {item.customerFirstName} {item.customerLastName}
            </H4>
            <P>
              {item.startDate.format("DD/MM/YYYY")} - {item.endDate.format("DD/MM/YYYY")}
            </P>
            </View>
            <View className="p-4">
              <StatusBadge status={item.state} />
              {item.stateUpdatedAt.diff(dayjs(), "hours") < 24 && (
                <Badge className="bg-green-500">
                  <Text>Nouveau</Text>
                </Badge>
              )}
            </View>
          </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && query.length > 1 ? (
            <P style={{ marginTop: 24 }}>Aucun résultat</P>
          ) : null
        }
        style={{ marginTop: 16 }}
      />
    </View>
  );
}
const mapSearchResult = (data: SearchResultsResponse): SearchResponse => {
    const results = data.data.map((item) => {return {
        id: item.id,
        state: item.state,
        stateUpdatedAt: dayjs(item.state_updated_at),
        model: item.model,
        customerFirstName: item.customer_first_name,
        customerLastName: item.customer_last_name,
        customerEmail: item.customer_email,
        customerPhoneNumber: item.customer_phone_number,
        createdAt: item.created_at,
        unitId: item.unit_id,
        startDate: dayjs(item.start_date),
        endDate: dayjs(item.end_date),
        priceAmountMinor: item.price_amount_minor,
        currency: item.currency,
        formattedPrice: item.formatted_price,
    }});
    return {
      results: results,
      next: data.pagination.next,
      previous: data.pagination.previous,
    };
}

