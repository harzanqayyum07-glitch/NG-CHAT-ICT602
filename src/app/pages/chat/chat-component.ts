import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { ModalComponent } from '../../layout/modal/modal-component';
import { Router } from '@angular/router';
import { Ichat } from '../../interface/chat-interface';
import { ChatService } from '../../services/chat-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule, DatePipe, ModalComponent, CommonModule],
  templateUrl: './chat-component.html',
  styleUrl: './chat-component.css',
})
export class ChatComponent implements OnDestroy {
  private chat_service = inject(ChatService);
  public auth = inject(AuthService);
  chatForm!: FormGroup;
  private fb = inject(FormBuilder);
  chats = signal<Ichat[]>([]);
  private router = inject(Router);
  private subscription: any;

  constructor() {
    // effect(() => {
    //   this.onListChat();
    // });
  }

  ngOnInit() {
    this.onListChat(); // Fetch initial chat messages
    this.chatForm = this.fb.group({
      chat_message: ['', Validators.required],
    });

    // Subscribe to new messages in real-time
    this.subscription = this.chat_service.onNewMessage((newMessage) => {
      console.log('Component: Received new message from service:', newMessage);
      this.chats.update(currentChats => [...currentChats, newMessage]);
    });
  }

  ngOnDestroy() {
    // It's important to unsubscribe to prevent memory leaks when the component is destroyed
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSubmit() {
    const formValue = this.chatForm.value.chat_message;
    console.log(formValue);

    this.chat_service
      .chatMessage(formValue)
      .then((res) => {
        console.log(res);
        this.chatForm.reset();
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  onListChat() {
    this.chat_service
      .listChat()
      .then((res: Ichat[] | null) => {
        console.log(res);
        if (res !== null) {
          this.chats.set(res);
        } else {
          console.log('No messages Found');
        }
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  openDropDown(msg: Ichat) {
    console.log(msg);
    this.chat_service.selectedChats(msg);
  }

  async logOut() {
    console.log('Logout button clicked.');
    this.auth
      .signOut()
      .then(() => {
        console.log('SignOut successful, navigating to login.');
        this.router.navigate(['/login']);
      })
      .catch((err) => {
        console.error('SignOut failed:', err);
        alert(err.message);
      });
  }
}
