import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-albia-chat',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './chat.component.html',
  host: { class: 'flex-1 flex flex-col min-h-0' }
})
export class AlbiaChatComponent {}
