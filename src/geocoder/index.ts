import {
  GeoPlacesClient,
  SearchTextCommand,
  ReverseGeocodeCommand,
  SuggestCommand,
  GetPlaceCommand,
  SearchTextCommandInput,
  ReverseGeocodeCommandInput,
  SuggestCommandInput,
  GetPlaceCommandInput,
} from "@aws-sdk/client-geoplaces";

import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import maplibregl, { IControl } from "maplibre-gl";
import {
  CategoriesEnum,
  CountriesEnum,
  BoundingBox,
  Position,
  AmazonLocationGeocoderApi,
  PlacesGeocoderOptions,
} from "../common/types";

import {
  ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE,
  MAX_CATEGORY_FILTERS,
  MAX_COUNTRY_FILTERS,
} from "../common/constants";

export class AmazonLocationMaplibreGeocoder {
  private readonly maplibreGeocoder: MaplibreGeocoder = null;
  private filterCountries: CountriesEnum[] = [];
  private filterCategories: CategoriesEnum[] = [];
  private filterBBox: BoundingBox = null;
  private biasPosition: Position = null;
  private language = "en";
  readonly amazonLocationApi: AmazonLocationGeocoderApi;

  public constructor(amazonLocationGeocoderApi: AmazonLocationGeocoderApi, options?) {
    console.log(
      "Constructor called with amazonLocationGeocoderApi:",
      amazonLocationGeocoderApi,
      "and options:",
      options,
    );
    this.amazonLocationApi = amazonLocationGeocoderApi;
    if (this.amazonLocationApi.forwardGeocode != undefined) {
      console.log("Here is the current options: ");
      parseObject(options);

      this.maplibreGeocoder = new MaplibreGeocoder(this.amazonLocationApi, {
        maplibregl: maplibregl,
        language: this.language,
        ...options,
      });
      console.log("MaplibreGeocoder instance created:", this.maplibreGeocoder);
    } else {
      throw new Error(ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE);
    }
  }

  public getPlacesGeocoder(): IControl {
    console.log("getPlacesGeocoder called");
    return this.maplibreGeocoder;
  }

  public setCategoryFilter(filters: CategoriesEnum[]): boolean {
    console.log("setCategoryFilter called with filters:", filters);
    if (filters.length <= MAX_CATEGORY_FILTERS) {
      this.filterCategories = filters;
      this.updateMaplibreGeocoderCategoryFilter();
      return true;
    }
    console.log(
      `Number of categories ${filters.length} exceeds max number of ${MAX_CATEGORY_FILTERS} at a time. No change to filter selection.`,
    );
    return false;
  }

  public addCategoryFilter(category: string): boolean {
    console.log("addCategoryFilter called with category:", category);
    if (this.filterCategories.length < MAX_CATEGORY_FILTERS) {
      const fixedStr = removeWhiteSpace(category);
      const enumCategory = CategoriesEnum[fixedStr as keyof typeof CategoriesEnum];
      if (enumCategory) {
        this.filterCategories.push(enumCategory);
        this.updateMaplibreGeocoderCategoryFilter();
        return true;
      } else {
        console.log(
          `String: ${category}, is not a valid Category Filter. Please check the accepted Category Filters, and try again.`,
        );
      }
    } else {
      console.log(
        `Number of categories is already at max filters of ${MAX_CATEGORY_FILTERS}. No change to filter selection. Remove a category before adding another.`,
      );
    }
    return false;
  }

  public clearCategoryFilter(): void {
    console.log("clearCategoryFilter called");
    this.filterCategories = [];
    this.updateMaplibreGeocoderCategoryFilter();
  }

  public getCategoryFilter() {
    console.log("getCategoryFilter called, returning:", this.filterCategories);
    return this.filterCategories;
  }

  private updateMaplibreGeocoderCategoryFilter() {
    console.log("updateMaplibreGeocoderCategoryFilter called with filterCategories:", this.filterCategories);
    this.maplibreGeocoder.setTypes(this.filterCategories.join(","));
    console.log(`Here is the string that maplibreGeocoder stores: ${this.maplibreGeocoder.getTypes()}`);
  }

  public setCountryFilter(filters: CountriesEnum[]): boolean {
    console.log("setCountryFilter called with filters:", filters);
    if (filters.length <= MAX_COUNTRY_FILTERS) {
      this.filterCountries = filters;
      this.updateMaplibreGeocoderCountryFilter();
      return true;
    }
    console.log(
      `Number of countries ${filters.length} exceeds max number of ${MAX_COUNTRY_FILTERS} at a time. No change to filter selection.`,
    );
    return false;
  }

  public addCountryFilter(country: CountriesEnum): boolean {
    console.log("addCountryFilter called with country:", country);
    if (this.filterCountries.length < MAX_COUNTRY_FILTERS) {
      this.filterCountries.push(country);
      this.updateMaplibreGeocoderCountryFilter();
      return true;
    }
    console.log(
      `Number of countries is already at max filters of ${MAX_COUNTRY_FILTERS}. No change to filter selection. Remove a country before adding another.`,
    );
    return false;
  }

  public clearCountryFilter(): void {
    console.log("clearCountryFilter called");
    this.filterCountries = [];
    this.updateMaplibreGeocoderCountryFilter();
  }

  public getCountryFilter() {
    console.log("getCountryFilter called, returning:", this.filterCountries);
    return this.filterCountries;
  }

  private updateMaplibreGeocoderCountryFilter() {
    console.log("updateMaplibreGeocoderCountryFilter called with filterCountries:", this.filterCountries);
    this.maplibreGeocoder.setCountries(this.filterCountries.join(","));
    console.log(`Here is the string that maplibreGeocoder stores: ${this.maplibreGeocoder.getCountries()}`);
  }

  public setBoundingBox(boundingBox: BoundingBox): void {
    console.log("setBoundingBox called with boundingBox:", boundingBox);
    this.biasPosition = null;
    this.filterBBox = boundingBox;
    this.updateMaplibreGeocoderBoundingBox([
      this.filterBBox.longitudeSW,
      this.filterBBox.latitudeSW,
      this.filterBBox.longitudeNE,
      this.filterBBox.latitudeNE,
    ]);
  }

  public clearBoundingBox(): void {
    console.log("clearBoundingBox called");
    this.filterBBox = null;
    this.updateMaplibreGeocoderBoundingBox([]);
  }

  public getBoundingBox() {
    console.log("getBoundingBox called, returning:", this.filterBBox);
    return this.filterBBox;
  }

  private updateMaplibreGeocoderBoundingBox(BBox: number[]) {
    console.log("updateMaplibreGeocoderBoundingBox called with BBox:", BBox);
    this.maplibreGeocoder.setBbox(BBox);
    this.maplibreGeocoder.setProximity({});
  }

  public setBiasPosition(position: Position): void {
    console.log("setBiasPosition called with position:", position);
    this.filterBBox = null;
    this.biasPosition = position;
    this.updateMaplibreGeocoderBiasPosition(position);
  }

  public clearBiasPosition() {
    console.log("clearBiasPosition called");
    this.biasPosition = null;
    this.updateMaplibreGeocoderBiasPosition({});
  }

  public getBiasPosition() {
    console.log("getBiasPosition called, returning:", this.biasPosition);
    return this.biasPosition;
  }

  private updateMaplibreGeocoderBiasPosition(position): void {
    console.log("updateMaplibreGeocoderBiasPosition called with position:", position);
    this.maplibreGeocoder.setProximity(position);
    this.maplibreGeocoder.setBbox([]);
  }

  public clearFilters(): void {
    console.log("clearFilters called");
    this.filterCategories = [];
    this.filterCountries = [];
    this.filterBBox = null;
    this.biasPosition = null;
    this.updateMaplibreGeocoderCategoryFilter();
    this.updateMaplibreGeocoderCountryFilter();
    this.updateMaplibreGeocoderBoundingBox([]);
    this.updateMaplibreGeocoderBiasPosition({});
  }
}

export function buildAmazonLocationMaplibreGeocoder(
  amazonLocationClient: GeoPlacesClient,
  indexName: string,
  options?: PlacesGeocoderOptions,
) {
  const locationClient = amazonLocationClient;

  const amazonLocationGeocoderApi: AmazonLocationGeocoderApi = {};

  amazonLocationGeocoderApi.forwardGeocode = createAmazonLocationForwardGeocodeApi(locationClient);

  let maplibreglgeocoderOptions = {};

  if (options) {
    if (options.enableAll) {
      amazonLocationGeocoderApi.reverseGeocode = createAmazonLocationReverseGeocodeApi(locationClient);
      amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(locationClient);
      amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(locationClient);
      maplibreglgeocoderOptions = {
        ...maplibreglgeocoderOptions,
        reverseGeocode: true,
        showResultsWhileTyping: true,
      };
    } else {
      if (options.enableReverseGeocode) {
        amazonLocationGeocoderApi.reverseGeocode = createAmazonLocationReverseGeocodeApi(locationClient);
        maplibreglgeocoderOptions = {
          ...maplibreglgeocoderOptions,
          reverseGeocode: true,
        };
      }

      if (options.enableSearchByPlaceId) {
        amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(locationClient);
      }

      if (options.enableGetSuggestions) {
        amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(locationClient);
        maplibreglgeocoderOptions = {
          ...maplibreglgeocoderOptions,
          showResultsWhileTyping: true,
        };
      }
    }
  }

  const renderFunction = getRenderFunction();
  maplibreglgeocoderOptions = {
    ...maplibreglgeocoderOptions,
    render: renderFunction,
  };

  console.log("Returning new AmazonLocationMaplibreGeocoder with options:", maplibreglgeocoderOptions);
  return new AmazonLocationMaplibreGeocoder(amazonLocationGeocoderApi, maplibreglgeocoderOptions);
}

function parseObject(obj) {
  for (const key in obj) {
    console.log("key: " + key + ", value: " + obj[key]);
    if (obj[key] instanceof Object) {
      parseObject(obj[key]);
    }
  }
}

function removeWhiteSpace(str: string) {
  return str.replace(/\s/g, "");
}

function addWhiteSpace(str) {
  if (str == "ATM") {
    return str;
  }
  return str.replace(/([A-Z])/g, " $1").trim();
}

function createAmazonLocationForwardGeocodeApi(amazonLocationClient: GeoPlacesClient) {
  const client = amazonLocationClient;

  return async function (config) {
    console.log("forwardGeocode called with config:", config);
    const features = [];
    try {
      const searchTextParams: SearchTextCommandInput = {
        Query: config.query,
        BiasPosition: config.biasPosition ? [config.biasPosition.longitude, config.biasPosition.latitude] : undefined,
        MaxResults: 5,
        FilterBoundingBox: config.filterBBox ? config.filterBBox : undefined,
        FilterCountries: config.filterCountries ? config.filterCountries.split(",") : undefined,
        Language: config.language,
      };

      console.log("Sending SearchTextCommand with params:", searchTextParams);
      const command = new SearchTextCommand(searchTextParams);
      const data = await client.send(command);

      console.log("API response data:", data);

      if (data.Results) {
        for (const result of data.Results) {
          console.log("Processing result:", result);
          // Validate and extract required properties
          const position = result.Position;
          const address = result.Address;
          const label = address ? address.Label : null;

          if (position && address && label) {
            console.log("Result has the expected structure");
            const feature = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: position,
              },
              place_name: label,
              properties: result,
              text: label,
              place_type: ["place"],
              center: position,
            };
            features.push(feature);
            console.log("Added feature:", feature);
          } else {
            console.log("Result does not have the expected structure:", result);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }
    console.log("Returning features:", features);
    return { features: features };
  };
}

function createAmazonLocationReverseGeocodeApi(amazonLocationClient: GeoPlacesClient) {
  const client = amazonLocationClient;
  return async function (config) {
    console.log("reverseGeocode called with config:", config);
    const features = [];
    try {
      const reverseGeocodeParams: ReverseGeocodeCommandInput = {
        SearchPosition: config.query,
        Language: config.language[0],
        MaxResults: config.maxResults,
      };

      console.log("Sending ReverseGeocodeCommand with params:", reverseGeocodeParams);
      const command = new ReverseGeocodeCommand(reverseGeocodeParams);
      const data = await client.send(command);

      console.log("API response data:", data);

      if (data.Results) {
        for (const result of data.Results) {
          const place = result.Address;
          if (place && result.Position) {
            const point = result.Position;
            const feature = {
              type: "Feature",
              id: result.PlaceId,
              geometry: {
                type: "Point",
                coordinates: point,
              },
              place_name: result.Title,
              properties: result,
              text: result.Title,
              place_type: ["place"],
              center: point,
            };
            features.push(feature);
            console.log("Added feature:", feature);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to reverseGeocode with error: ${e}`);
    }
    console.log("Returning features:", features);
    return { features: features };
  };
}

function createAmazonLocationSearchPlaceById(amazonLocationClient: GeoPlacesClient) {
  const client = amazonLocationClient;
  return async function (config) {
    console.log("searchByPlaceId called with config:", config);
    let feature;
    try {
      const getPlaceParams: GetPlaceCommandInput = {
        PlaceId: config.query,
        Language: config.language[0],
      };

      console.log("Sending GetPlaceCommand with params:", getPlaceParams);
      const command = new GetPlaceCommand(getPlaceParams);
      const data = await client.send(command);

      console.log("API response data:", data);

      if (data.Position && data.Title) {
        const point = data.Position;
        feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: point,
          },
          place_name: data.Title,
          text: data.Title,
          center: point,
        };
        console.log("Added feature:", feature);
      }
    } catch (e) {
      console.error(`Failed to searchByPlaceId with error: ${e}`);
    }
    console.log("Returning place:", feature);
    return { place: feature };
  };
}

function createAmazonLocationGetSuggestions(amazonLocationClient: GeoPlacesClient) {
  const client = amazonLocationClient;
  return async function (config) {
    console.log("getSuggestions called with config:", config);
    const suggestions = [];
    try {
      const suggestParams: SuggestCommandInput = {
        Query: config.query,
        BiasPosition: config.biasPosition,
        MaxResults: config.maxResults,
        FilterBoundingBox: config.bbox ? config.bbox : undefined,
        FilterCountries: config.countries ? config.countries.split(",") : undefined,
        Language: config.language[0],
      };

      console.log("Sending SuggestCommand with params:", suggestParams);
      const command = new SuggestCommand(suggestParams);
      const data = await client.send(command);

      console.log("API response data:", data);

      if (data.Results) {
        for (const result of data.Results) {
          const suggestionWithPlace = {
            text: result.Title,
            placeId: result.Place,
          };
          suggestions.push(suggestionWithPlace);
          console.log("Added suggestion:", suggestionWithPlace);
        }
      }
    } catch (e) {
      console.error(`Failed to getSuggestions with error: ${e}`);
    }

    console.log("Returning suggestions:", suggestions);
    return {
      suggestions: suggestions,
    };
  };
}

function getRenderFunction() {
  return function (item) {
    const geometry = item.geometry ? item.geometry : undefined;
    const placeId = item.placeId ? item.placeId : "";
    const text = item.text ? item.text : "";

    const separateIndex = text != "" ? text.indexOf(",") : -1;
    const title = separateIndex > -1 ? text.substring(0, separateIndex) : text;
    const address = separateIndex > 1 ? text.substring(separateIndex + 1).trim() : null;

    if (placeId || geometry) {
      if (address) {
        return (
          '<div class="mlg-option-container">' +
          '<svg class="mlg-icon" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M7.21875,20.96875 C7.21875,21.5402344 6.75898437,22 6.1875,22 C5.61601562,22 5.15625,21.5402344 5.15625,20.96875 L5.15625,12.2890625 C2.23007813,11.7992188 0,9.25546875 0,6.1875 C0,2.77019531 2.77019531,0 6.1875,0 C9.60351562,0 12.375,2.77019531 12.375,6.1875 C12.375,9.25546875 10.1449219,11.7992188 7.21875,12.2890625 L7.21875,20.96875 Z M6.1875,2.0625 C3.87148437,2.0625 2.0625,3.90929687 2.0625,6.1875 C2.0625,8.46484375 3.87148437,10.3125 6.1875,10.3125 C8.46484375,10.3125 10.3125,8.46484375 10.3125,6.1875 C10.3125,3.90929687 8.46484375,2.0625 6.1875,2.0625 Z" fill="#687078"/></svg>' +
          '<div class="mlg-option-details">' +
          '<div class="mlg-place-name">' +
          title +
          "</div>" +
          '<div class="mlg-address">' +
          address +
          "</div>" +
          "</div>" +
          "</div>"
        );
      }
      return (
        '<div class="mlg-option-container">' +
        '<svg class="mlg-icon" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M7.21875,20.96875 C7.21875,21.5402344 6.75898437,22 6.1875,22 C5.61601562,22 5.15625,21.5402344 5.15625,20.96875 L5.15625,12.2890625 C2.23007813,11.7992188 0,9.25546875 0,6.1875 C0,2.77019531 2.77019531,0 6.1875,0 C9.60351562,0 12.375,2.77019531 12.375,6.1875 C12.375,9.25546875 10.1449219,11.7992188 7.21875,12.2890625 L7.21875,20.96875 Z M6.1875,2.0625 C3.87148437,2.0625 2.0625,3.90929687 2.0625,6.1875 C2.0625,8.46484375 3.87148437,10.3125 6.1875,10.3125 C8.46484375,10.3125 10.3125,8.46484375 10.3125,6.1875 C10.3125,3.90929687 8.46484375,2.0625 6.1875,2.0625 Z" fill="#687078"/></svg>' +
        '<div class="mlg-option-details">' +
        '<div class="mlg-place-name">' +
        title +
        "</div>" +
        '<div class="mlg-address">' +
        "Search Nearby" +
        "</div>" +
        "</div>" +
        "</div>"
      );
    } else {
      if (address) {
        return (
          '<div class="mlg-option-container">' +
          '<svg class="mlg-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2,8 C2,4.691 4.691,2 8,2 C11.309,2 14,4.691 14,8 C14,11.309 11.309,14 8,14 C4.691,14 2,11.309 2,8 M17.707,16.293 L14.312,12.897 C15.365,11.543 16,9.846 16,8 C16,3.589 12.411,0 8,0 C3.589,0 0,3.589 0,8 C0,12.411 3.589,16 8,16 C9.846,16 11.543,15.365 12.897,14.312 L16.293,17.707 C16.488,17.902 16.744,18 17,18 C17.256,18 17.512,17.902 17.707,17.707 C18.098,17.316 18.098,16.684 17.707,16.293" fill="#687078"/></svg>' +
          '<div class="mlg-option-details">' +
          '<div class="mlg-place-name">' +
          title +
          "</div>" +
          '<div class="mlg-address">' +
          address +
          "</div>" +
          "</div>" +
          "</div>"
        );
      }
      return (
        '<div class="mlg-option-container">' +
        '<svg class="mlg-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2,8 C2,4.691 4.691,2 8,2 C11.309,2 14,4.691 14,8 C14,11.309 11.309,14 8,14 C4.691,14 2,11.309 2,8 M17.707,16.293 L14.312,12.897 C15.365,11.543 16,9.846 16,8 C16,3.589 12.411,0 8,0 C3.589,0 0,3.589 0,8 C0,12.411 3.589,16 8,16 C9.846,16 11.543,15.365 12.897,14.312 L16.293,17.707 C16.488,17.902 16.744,18 17,18 C17.256,18 17.512,17.902 17.707,17.707 C18.098,17.316 18.098,16.684 17.707,16.293" fill="#687078"/></svg>' +
        '<div class="mlg-option-details">' +
        '<div class="mlg-place-name">' +
        title +
        "</div>" +
        '<div class="mlg-address">' +
        "Search Nearby" +
        "</div>" +
        "</div>" +
        "</div>"
      );
    }
  };
}
