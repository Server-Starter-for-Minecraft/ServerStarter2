import { defineStore } from 'pinia';
import { propertyClasses } from 'src/components/World/Property/classifications';

export const useWorldTabsStore = defineStore('worldTabsStore', {
  state: () => {
    return {
      property: {
        searchName: '',
        selectTab: 'base'
      }
    }
  },
  actions: {
    searchProperties(groupName?: string) {
      const propClassName = groupName ?? this.property.selectTab
      
      if (this.property.searchName !== '') {
        return propertyClasses[propClassName].filter(
          (prop) => prop.match(this.property.searchName)
        );
      }
      
      return propertyClasses[propClassName];
    }
  }
});