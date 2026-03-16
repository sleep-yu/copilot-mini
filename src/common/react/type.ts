export interface Props {
  [key: string]: unknown;
}

export interface Element {
  type: string | undefined | Function;
  props: Props & {
    nodeValue?: string;
    children: Node | Node[];
  };
}

export type Node = Element | string;
