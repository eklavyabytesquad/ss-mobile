import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import supabase from '../../utils/supabase';
import Colors from '../../constants/colors';

export default function CityRates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [transports, setTransports] = useState([]);
  const [rates, setRates] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const searchCities = async (query) => {
    if (!query || query.trim().length < 2) {
      setCities([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, city_name, city_code')
        .or(`city_name.ilike.%${query}%,city_code.ilike.%${query}%`)
        .order('city_name', { ascending: true })
        .limit(20);

      if (error) throw error;
      setCities(data || []);
      
      if (data && data.length === 0) {
        Alert.alert('No Results', `No cities found matching "${query}"`);
      }
    } catch (error) {
      console.error('City search error:', error);
      Alert.alert('Search Error', 'Failed to search cities. Please try again.');
      setCities([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCity = async (city) => {
    setSelectedCity(city);
    setCities([]);
    setSearchQuery(city.city_name);
    setIsLoadingDetails(true);

    try {
      // Fetch transports for this city
      const { data: transportData, error: transportError } = await supabase
        .from('transports')
        .select('id, transport_name, address, gst_number, mob_number, branch_owner_name, website')
        .eq('city_id', city.id)
        .order('transport_name');

      if (transportError) throw transportError;
      setTransports(transportData || []);

      // Fetch rates for this city (only non-consignor specific rates)
      const { data: rateData, error: rateError } = await supabase
        .from('rates')
        .select('id, rate, is_default')
        .eq('city_id', city.id)
        .is('consignor_id', null)
        .order('rate');

      if (rateError) throw rateError;
      setRates(rateData || []);
    } catch (error) {
      console.error('Details fetch error:', error);
      Alert.alert('Error', 'Failed to fetch city details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      searchCities(text);
    } else {
      setCities([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCity(null);
    setCities([]);
    setTransports([]);
    setRates([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{
        backgroundColor: Colors.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 }}>
          City Search & Rates
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          Find transport & freight rates by city
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Box */}
        <View style={{ padding: 20 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
              🔍 Search City
            </Text>
            
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#1f2937',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingRight: 40,
                }}
                placeholder="Enter city name or code"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="words"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: [{ translateY: -10 }],
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#e5e7eb',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={clearSearch}
                >
                  <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {isSearching && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <ActivityIndicator color={Colors.primary} size="small" />
              </View>
            )}

            {/* City Results Dropdown */}
            {cities.length > 0 && (
              <View style={{
                marginTop: 12,
                backgroundColor: '#fff',
                borderRadius: 12,
                maxHeight: 250,
                borderWidth: 1,
                borderColor: Colors.primary,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <View style={{
                  backgroundColor: Colors.primary,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }}>
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
                    📍 {cities.length} {cities.length === 1 ? 'city' : 'cities'} found
                  </Text>
                </View>
                <ScrollView nestedScrollEnabled>
                  {cities.map((city, index) => (
                    <TouchableOpacity
                      key={city.id}
                      style={{
                        padding: 14,
                        borderBottomWidth: index < cities.length - 1 ? 1 : 0,
                        borderBottomColor: '#f3f4f6',
                        backgroundColor: '#fff',
                      }}
                      onPress={() => selectCity(city)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 }}>
                            {city.city_name}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6b7280' }}>
                            Code: {city.city_code}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 20, color: Colors.primary }}>→</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Loading Details */}
        {isLoadingDetails && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading details...</Text>
          </View>
        )}

        {/* City Details */}
        {selectedCity && !isLoadingDetails && (
          <>
            {/* Freight Rates Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
                💰 Freight Rates
              </Text>
              
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}>
                {rates.length === 0 ? (
                  <Text style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 12 }}>
                    No rates available for this city
                  </Text>
                ) : (
                  rates.map((rate, index) => (
                    <View
                      key={rate.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: index < rates.length - 1 ? 1 : 0,
                        borderBottomColor: '#f3f4f6',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, color: '#1f2937' }}>
                          Rate per KG
                        </Text>
                        {rate.is_default && (
                          <View style={{
                            backgroundColor: '#dbeafe',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            marginLeft: 8,
                          }}>
                            <Text style={{ fontSize: 10, color: '#1e40af', fontWeight: '600' }}>
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.primary }}>
                        ₹{rate.rate}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Transports Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 }}>
                🚚 Transport Partners ({transports.length})
              </Text>

              {transports.length === 0 ? (
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <Text style={{ color: '#6b7280', textAlign: 'center' }}>
                    No transport partners available for this city
                  </Text>
                </View>
              ) : (
                transports.map((transport) => (
                  <View
                    key={transport.id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: Colors.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8 }}>
                      {transport.transport_name}
                    </Text>

                    {transport.branch_owner_name && (
                      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', width: 80 }}>Owner:</Text>
                        <Text style={{ fontSize: 13, color: '#1f2937', flex: 1, fontWeight: '500' }}>
                          {transport.branch_owner_name}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', width: 80 }}>📍 Address:</Text>
                      <Text style={{ fontSize: 13, color: '#1f2937', flex: 1 }}>
                        {transport.address}
                      </Text>
                    </View>

                    {transport.mob_number && (
                      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', width: 80 }}>📱 Phone:</Text>
                        <Text style={{ fontSize: 13, color: '#1f2937', flex: 1, fontWeight: '500' }}>
                          {transport.mob_number}
                        </Text>
                      </View>
                    )}

                    {transport.gst_number && (
                      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', width: 80 }}>GST:</Text>
                        <Text style={{ fontSize: 13, color: '#1f2937', flex: 1, fontWeight: '500' }}>
                          {transport.gst_number}
                        </Text>
                      </View>
                    )}

                    {transport.website && (
                      <View style={{ flexDirection: 'row' }}>
                        <Text style={{ fontSize: 13, color: '#6b7280', width: 80 }}>🌐 Website:</Text>
                        <Text style={{ fontSize: 13, color: '#3b82f6', flex: 1 }}>
                          {transport.website}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* Empty State */}
        {!selectedCity && !isSearching && searchQuery.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏙️</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 }}>
              Search for a City
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
              Enter a city name or code to view transport partners and freight rates
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
