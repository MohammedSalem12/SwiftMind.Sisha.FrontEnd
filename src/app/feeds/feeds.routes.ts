import { Route } from '@angular/router';
import { FeedsComponent } from './feeds.component';
import { FeedDetailComponent } from './feed-detail.component';

export const feedsRoutes: Route[] = [
  {
    path: '',
    component: FeedsComponent,
  },
  {
    path: ':id',
    component: FeedDetailComponent,
  },
];
