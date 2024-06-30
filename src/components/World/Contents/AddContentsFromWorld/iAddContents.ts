import { AllFileData } from 'app/src-electron/schema/filedata';
import { ContentsData, ContentsType } from '../contentsPage';

export interface AddContentProp {
  contentType: ContentsType;
}

export interface AddContentsReturns {
  importContents: AllFileData<ContentsData>[];
}
