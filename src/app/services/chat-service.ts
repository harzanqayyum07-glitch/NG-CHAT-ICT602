import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Ichat } from '../interface/chat-interface';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private supabase = inject(SupabaseService).supabase;
  public savedChat = signal({});

  constructor(private ngZone: NgZone) {}

  async chatMessage(text: string) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      const { data, error } = await this.supabase
        .from('chat')
        .insert({ text, sender: user?.id });
      if (error) {
        alert(error.message);
      }
    } catch (error) {
      alert(error);
    }
  }

  async listChat() {
    try {
      console.log('Fetching chat messages...');
      const { data, error } = await this.supabase
        .from('chat')
        .select('*,users(*)');

      if (error) {
        console.error('Error fetching chat messages:', error);
        alert(error.message);
      }
      
      console.log('Chat messages fetched:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error in listChat:', error);
      throw error;
    }
  }

  async deleteChat(id: string) {
    const data = await this.supabase.from('chat').delete().eq('id', id);

    return data;
  }

  selectedChats(msg: Ichat) {
    this.savedChat.set(msg);
  }

  onNewMessage(callback: (message: Ichat) => void) {
    return this.supabase
      .channel('chat-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat' },
        (payload) => {
          console.log('Realtime: Received new payload:', payload);

          // When a new message comes in, the payload only has the sender ID.
          // We need to fetch the related user data to match the Ichat interface.
          this.supabase
            .from('users')
            .select('*')
            .eq('id', payload.new['sender'])
            .single()
            .then(({ data: userData, error }) => {
              this.ngZone.run(() => {
                if (error) {
                  console.error('Error fetching user for new message:', error);
                  console.log('Realtime: Calling callback (with error).');
                  // Even if user fetch fails, we can still show the message without user details.
                  callback({ ...payload.new, users: null } as Ichat);
                } else {
                  console.log('Realtime: Calling callback (success).');
                  callback({ ...payload.new, users: userData } as Ichat);
                }
              });
            });
        }
      )
      .subscribe();
  }
}
